
import React, { useState } from 'react';
import { QuizSet, Question, QuestionType, Option } from '../types';
import { Button } from './Button';
import { JSONImporter } from './JSONImporter';
import { Dialog } from './Dialog';

interface QuizEditorProps {
  onSave: (quiz: QuizSet) => void;
  onCancel: () => void;
  initialQuiz?: QuizSet;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ onSave, onCancel, initialQuiz }) => {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [questions, setQuestions] = useState<Question[]>(initialQuiz?.questions || []);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text: '',
      points: 5,
      correctAnswers: [],
      options: (type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) 
        ? [{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }] 
        : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleOptionChange = (qId: string, optId: string, text: string) => {
    const q = questions.find(item => item.id === qId);
    if (!q || !q.options) return;
    const newOptions = q.options.map(o => o.id === optId ? { ...o, text } : o);
    updateQuestion(qId, { options: newOptions });
  };

  const toggleCorrectAnswer = (qId: string, val: string, isSingle: boolean) => {
    const q = questions.find(item => item.id === qId);
    if (!q) return;
    let newAnswers: string[];
    if (isSingle) {
      newAnswers = [val];
    } else {
      newAnswers = q.correctAnswers.includes(val)
        ? q.correctAnswers.filter(a => a !== val)
        : [...q.correctAnswers, val];
    }
    updateQuestion(qId, { correctAnswers: newAnswers });
  };

  const addOption = (qId: string) => {
    const q = questions.find(item => item.id === qId);
    if (!q || !q.options) return;
    const nextId = (q.options.length + 1).toString();
    updateQuestion(qId, { options: [...q.options, { id: nextId, text: `Option ${nextId}` }] });
  };

  const removeOption = (qId: string, optId: string) => {
    const q = questions.find(item => item.id === qId);
    if (!q || !q.options || q.options.length <= 1) return;
    updateQuestion(qId, { 
      options: q.options.filter(o => o.id !== optId),
      correctAnswers: q.correctAnswers.filter(a => a !== optId)
    });
  };

  const handleSave = () => {
    if (!title.trim()) {
      setAlert({ isOpen: true, title: "Title Required", message: "Please provide a title for your quiz set." });
      return;
    }
    if (questions.length === 0) {
      setAlert({ isOpen: true, title: "No Questions", message: "Add at least one question." });
      return;
    }
    // Basic validation for questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setAlert({ isOpen: true, title: "Empty Question", message: `Question ${i + 1} has no text.` });
        return;
      }
      if (q.type !== QuestionType.SUBJECTIVE && q.correctAnswers.length === 0) {
        setAlert({ isOpen: true, title: "No Correct Answer", message: `Question ${i + 1} must have at least one correct answer.` });
        return;
      }
    }

    onSave({
      id: initialQuiz?.id || Math.random().toString(36).substr(2, 9),
      title,
      description,
      createdAt: Date.now(),
      questions,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in slide-in-from-bottom-8 duration-500">
      {isJsonOpen && <JSONImporter onImport={(d) => {
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.questions) setQuestions(d.questions as Question[]);
      }} onClose={() => setIsJsonOpen(false)} />}

      <Dialog 
        isOpen={alert.isOpen} 
        onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type="warning"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{initialQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h1>
        <Button variant="secondary" size="sm" onClick={() => setIsJsonOpen(true)}>Import JSON</Button>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <input 
            type="text" className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold"
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz Title (e.g., Biology Midterm)"
          />
          <textarea 
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the test content..."
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Questions ({questions.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {Object.values(QuestionType).map(type => (
              <Button key={type} size="sm" variant="secondary" onClick={() => addQuestion(type)}>
                + {type.toLowerCase().replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group relative animate-in fade-in slide-in-from-top-4">
             <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>

             <div className="flex items-center gap-2 mb-4">
               <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
               <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{q.type.replace(/_/g, ' ')}</span>
             </div>

             <textarea 
               className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium mb-4 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
               value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Type your question here..."
             />

             <div className="space-y-3 mb-6">
               {(q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) && (
                 <>
                   {q.options?.map(opt => (
                     <div key={opt.id} className="flex items-center gap-2">
                       <button 
                         onClick={() => toggleCorrectAnswer(q.id, opt.id, q.type === QuestionType.SINGLE_CHOICE)}
                         className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${q.correctAnswers.includes(opt.id) ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                       </button>
                       <input 
                         type="text" className="flex-grow p-2 text-sm bg-slate-50 border-none rounded-lg focus:bg-white focus:ring-1 focus:ring-indigo-300 outline-none"
                         value={opt.text} onChange={(e) => handleOptionChange(q.id, opt.id, e.target.value)}
                       />
                       <button onClick={() => removeOption(q.id, opt.id)} className="text-slate-300 hover:text-red-400">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                     </div>
                   ))}
                   <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-indigo-600">+ Add Option</Button>
                 </>
               )}

               {q.type === QuestionType.TRUE_FALSE && (
                 <div className="flex gap-2">
                   {['true', 'false'].map(val => (
                     <button
                        key={val}
                        onClick={() => updateQuestion(q.id, { correctAnswers: [val] })}
                        className={`flex-1 py-2 rounded-lg border font-bold capitalize transition-all ${q.correctAnswers[0] === val ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                     >
                       {val}
                     </button>
                   ))}
                 </div>
               )}

               {q.type === QuestionType.FILL_IN_THE_BLANK && (
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Acceptable Answers (Comma separated)</label>
                   <input 
                     type="text" className="w-full p-3 bg-slate-50 rounded-lg border-none focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                     placeholder="Answer 1, Answer 2, ..."
                     value={q.correctAnswers.join(', ')}
                     onChange={(e) => updateQuestion(q.id, { correctAnswers: e.target.value.split(',').map(s => s.trim()) })}
                   />
                 </div>
               )}

               {q.type === QuestionType.SUBJECTIVE && (
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reference Answer (For review)</label>
                   <textarea 
                     className="w-full p-3 bg-slate-50 rounded-lg border-none focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                     placeholder="Points to look for in the answer..."
                     value={q.subjectiveReference || ''}
                     onChange={(e) => updateQuestion(q.id, { subjectiveReference: e.target.value })}
                   />
                 </div>
               )}
             </div>

             <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t pt-4">
               <div className="flex items-center gap-2">
                 <span>POINTS:</span>
                 <input 
                  type="number" className="w-14 p-1 border rounded text-center text-slate-800" 
                  value={q.points} onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })} 
                 />
               </div>
             </div>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex justify-center gap-4 z-40">
        <Button variant="ghost" onClick={onCancel}>Discard Changes</Button>
        <Button variant="primary" className="px-12 shadow-xl shadow-indigo-200" onClick={handleSave}>Save Quiz Set</Button>
      </div>
    </div>
  );
};
