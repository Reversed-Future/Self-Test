
import React, { useState } from 'react';
import { QuizSet, Question, QuestionType } from '../types';
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

  const handleSave = () => {
    if (!title.trim()) {
      setAlert({ isOpen: true, title: "Title Required", message: "Please provide a title for your quiz set before saving." });
      return;
    }
    if (questions.length === 0) {
      setAlert({ isOpen: true, title: "No Questions", message: "A quiz set must have at least one question." });
      return;
    }
    onSave({
      id: initialQuiz?.id || Math.random().toString(36).substr(2, 9),
      title,
      description,
      createdAt: Date.now(),
      questions,
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
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
        <h2 className="text-lg font-bold text-slate-800 mb-6">General Information</h2>
        <div className="space-y-4">
          <input 
            type="text" className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold"
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz Title"
          />
          <textarea 
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what learners will test..."
          />
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-lg font-bold text-slate-800">Questions ({questions.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {Object.values(QuestionType).map(type => (
              <Button key={type} size="sm" variant="secondary" onClick={() => addQuestion(type)}>+ {type.toLowerCase().replace('_', ' ')}</Button>
            ))}
          </div>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group relative">
             <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-4 right-4 text-slate-300 hover:text-red-500">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>
             <div className="flex items-center gap-2 mb-4">
               <span className="w-6 h-6 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
               <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{q.type}</span>
             </div>
             <textarea 
               className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium mb-4 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
               value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Question text..."
             />
             {/* Question Logic UI (Condensed for brevity) */}
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-slate-400">POINTS:</span>
               <input type="number" className="w-16 p-2 border rounded-lg text-center font-bold" value={q.points} onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })} />
             </div>
          </div>
        ))}
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t flex justify-center gap-4 z-40">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" className="px-12 shadow-xl shadow-indigo-200" onClick={handleSave}>Save Quiz</Button>
      </div>
    </div>
  );
};
