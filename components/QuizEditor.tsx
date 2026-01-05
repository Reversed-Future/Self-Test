
import React, { useState } from 'react';
import { QuizSet, Question, QuestionType, Option } from '../types';
import { Button } from './Button';
import { JSONImporter } from './JSONImporter';

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

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSave = () => {
    if (!title) {
      alert("Please provide a title");
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

  const handleDataImported = (data: Partial<QuizSet>) => {
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.questions) {
      const formatted = data.questions.map(q => ({
        ...q,
        id: q.id || Math.random().toString(36).substr(2, 9),
      })) as Question[];
      setQuestions(formatted);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      {isJsonOpen && (
        <JSONImporter onImport={handleDataImported} onClose={() => setIsJsonOpen(false)} />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">{initialQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setIsJsonOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Import JSON
          </Button>
        </div>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-6">General Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
            <input 
              type="text" 
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Mid-Term Physics Quiz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this quiz about?"
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Questions ({questions.length})</h2>
          <div className="flex flex-wrap gap-2">
            {Object.values(QuestionType).map(type => (
              <Button key={type} size="sm" variant="secondary" onClick={() => addQuestion(type)}>
                + {type.replace(/_/g, ' ').toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">No questions added yet. Use JSON import or add manually.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group transition-all hover:border-indigo-200">
              <button 
                onClick={() => removeQuestion(q.id)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                   <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                   <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{q.type.replace(/_/g, ' ')}</label>
                </div>
                <textarea
                  className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  rows={2}
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  placeholder="Enter the question text..."
                />
              </div>

              <div className="mt-4 space-y-4">
                {(q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase">Options & Correct Selection</label>
                    {q.options?.map(opt => (
                      <div key={opt.id} className="flex items-center gap-3">
                        <input 
                          type={q.type === QuestionType.SINGLE_CHOICE ? "radio" : "checkbox"} 
                          checked={q.correctAnswers.includes(opt.id)}
                          onChange={() => {
                            if (q.type === QuestionType.SINGLE_CHOICE) {
                              updateQuestion(q.id, { correctAnswers: [opt.id] });
                            } else {
                              const news = q.correctAnswers.includes(opt.id) 
                                ? q.correctAnswers.filter(id => id !== opt.id)
                                : [...q.correctAnswers, opt.id];
                              updateQuestion(q.id, { correctAnswers: news });
                            }
                          }}
                        />
                        <input 
                          type="text" 
                          className="flex-grow p-2 rounded-md border border-slate-200 text-sm bg-white"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = q.options?.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o);
                            updateQuestion(q.id, { options: newOpts });
                          }}
                        />
                        <button className="text-slate-300 hover:text-red-500" onClick={() => {
                          const newOpts = q.options?.filter(o => o.id !== opt.id);
                          updateQuestion(q.id, { options: newOpts });
                        }}>&times;</button>
                      </div>
                    ))}
                    <button className="text-xs font-bold text-indigo-600 hover:underline" onClick={() => {
                      const newId = Math.random().toString(36).substr(2, 5);
                      updateQuestion(q.id, { options: [...(q.options || []), { id: newId, text: `Option ${(q.options?.length || 0) + 1}` }] });
                    }}>+ Add Option</button>
                  </div>
                )}

                {q.type === QuestionType.TRUE_FALSE && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Correct Answer</label>
                    <div className="flex gap-2">
                      {['true', 'false'].map(val => (
                        <button 
                          key={val}
                          className={`flex-1 py-2 rounded-lg border font-medium capitalize transition-all ${q.correctAnswers[0] === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
                          onClick={() => updateQuestion(q.id, { correctAnswers: [val] })}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === QuestionType.FILL_IN_THE_BLANK && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Accepted Answers (One per line)</label>
                    <textarea 
                      className="w-full p-2 border rounded-md text-sm bg-white"
                      placeholder="e.g. Gravity&#10;Gravitation"
                      rows={2}
                      value={q.correctAnswers.join('\n')}
                      onChange={(e) => updateQuestion(q.id, { correctAnswers: e.target.value.split('\n').filter(x => x.trim()) })}
                    />
                  </div>
                )}

                {q.type === QuestionType.SUBJECTIVE && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Reference Answer</label>
                    <textarea 
                      className="w-full p-2 border rounded-md text-sm bg-white"
                      rows={3}
                      value={q.subjectiveReference || ''}
                      onChange={(e) => updateQuestion(q.id, { subjectiveReference: e.target.value })}
                      placeholder="Provide the ideal answer for student reference..."
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Points:</label>
                    <input 
                      type="number" 
                      className="w-16 p-1 border rounded text-sm text-center font-bold text-indigo-600"
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl z-40 flex justify-center gap-4">
        <Button variant="ghost" onClick={onCancel}>Discard</Button>
        <Button variant="primary" className="px-12 shadow-lg shadow-indigo-100" onClick={handleSave}>Save Quiz Set</Button>
      </div>
    </div>
  );
};
