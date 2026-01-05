
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from './Button';
import { QuizSet, QuestionType } from '../types';
import { Dialog } from './Dialog';

interface AIGeneratorProps {
  onGenerated: (quiz: Partial<QuizSet>) => void;
  onClose: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ onGenerated, onClose }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setStatus('Thinking...');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a comprehensive quiz about "${topic}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    points: { type: Type.NUMBER },
                    options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, text: { type: Type.STRING } } } },
                    correctAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    subjectiveReference: { type: Type.STRING }
                  },
                  required: ["type", "text", "points", "correctAnswers"]
                }
              }
            },
            required: ["title", "description", "questions"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty AI response.");

      const data = JSON.parse(text);
      const formattedQuestions = data.questions.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        options: q.options?.map((o: any, idx: number) => ({ ...o, id: o.id || (idx + 1).toString() }))
      }));

      onGenerated({ title: data.title, description: data.description, questions: formattedQuestions });
      onClose();
    } catch (err: any) {
      setError({ isOpen: true, message: err.message || "Something went wrong during generation." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Dialog 
        isOpen={error.isOpen} 
        onClose={() => setError({ isOpen: false, message: '' })} 
        title="Generation Failed" 
        message={error.message} 
        type="error" 
      />
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">AI Quiz Generator</h3>
        </div>
        <textarea 
          className="w-full p-4 rounded-xl border mb-6 h-32 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Topic..." value={topic} onChange={(e) => setTopic(e.target.value)} disabled={loading}
        />
        {loading && <div className="text-indigo-600 text-sm font-medium mb-4 flex items-center gap-2"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> {status}</div>}
        <div className="flex gap-3">
          <Button className="flex-grow" onClick={generateQuiz} isLoading={loading}>Generate</Button>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};
