
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from './Button';
import { QuizSet, QuestionType } from '../types';

interface AIGeneratorProps {
  onGenerated: (quiz: Partial<QuizSet>) => void;
  onClose: () => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ onGenerated, onClose }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setStatus('Gemini is brainstorming questions...');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key is not configured in the environment.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Create a comprehensive quiz about "${topic}". Include a mix of: 
          - Single choice (SINGLE_CHOICE)
          - Multiple choice (MULTIPLE_CHOICE)
          - Fill in the blank (FILL_IN_THE_BLANK)
          - True/False (TRUE_FALSE)
          - Subjective (SUBJECTIVE)
          Total around 5-8 questions. Provide standard answers for objective questions and a reference answer for subjective ones.`,
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
                    type: { type: Type.STRING, description: "One of: SINGLE_CHOICE, MULTIPLE_CHOICE, FILL_IN_THE_BLANK, TRUE_FALSE, SUBJECTIVE" },
                    text: { type: Type.STRING },
                    points: { type: Type.NUMBER },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING }
                        }
                      }
                    },
                    correctAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    subjectiveReference: { type: Type.STRING },
                    explanation: { type: Type.STRING }
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
      if (!text) {
        throw new Error("The model returned an empty response.");
      }

      const data = JSON.parse(text);
      // Ensure IDs are unique for the generated options
      const formattedQuestions = data.questions.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        options: q.options?.map((o: any, idx: number) => ({ ...o, id: o.id || (idx + 1).toString() }))
      }));

      onGenerated({
        title: data.title,
        description: data.description,
        questions: formattedQuestions
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`AI Generation failed: ${error.message || "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">AI Quiz Generator</h3>
            <p className="text-slate-500 text-sm">Let Gemini design your test set</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic or Material</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-32"
              placeholder="e.g. World War II key events, Python Data Science, or paste some learning notes..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
          </div>
          {loading && (
            <div className="flex items-center gap-3 text-indigo-600">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">{status}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button 
            className="flex-grow py-3" 
            variant="primary" 
            onClick={generateQuiz}
            isLoading={loading}
          >
            Start Magic Generation
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};
