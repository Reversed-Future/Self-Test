
import React, { useState } from 'react';
import { Button } from './Button';
import { QuizSet, Question } from '../types';

interface JSONImporterProps {
  onImport: (data: Partial<QuizSet>) => void;
  onClose: () => void;
}

export const JSONImporter: React.FC<JSONImporterProps> = ({ onImport, onClose }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Basic validation
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error("Invalid JSON: Must be an object.");
      }

      // Check if it's a full QuizSet or just an array of questions
      let importData: Partial<QuizSet> = {};
      
      if (Array.isArray(parsed)) {
        importData = { questions: parsed as Question[] };
      } else {
        importData = parsed as Partial<QuizSet>;
      }

      if (importData.questions && !Array.isArray(importData.questions)) {
        throw new Error("The 'questions' field must be an array.");
      }

      onImport(importData);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to parse JSON. Please check the format.");
    }
  };

  const exampleJson = JSON.stringify({
    title: "Example Quiz",
    description: "Imported via JSON",
    questions: [
      {
        type: "SINGLE_CHOICE",
        text: "What is 2+2?",
        points: 5,
        options: [{ id: "1", text: "4" }, { id: "2", text: "5" }],
        correctAnswers: ["1"]
      }
    ]
  }, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Import from Raw JSON</h3>
            <p className="text-slate-500 text-sm">Paste your raw JSON quiz data below</p>
          </div>
        </div>

        <div className="flex-grow flex flex-col gap-4 overflow-hidden mb-6">
          <div className="flex-grow relative">
            <textarea 
              className={`w-full h-full p-4 font-mono text-xs rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:ring-2 focus:ring-indigo-500 outline-none resize-none`}
              placeholder="Paste JSON here..."
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                if (error) setError(null);
              }}
            />
            {!jsonText && (
              <div className="absolute top-4 left-4 pointer-events-none opacity-40">
                <pre className="text-[10px]">{exampleJson}</pre>
              </div>
            )}
          </div>
          {error && (
            <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button className="flex-grow py-3" variant="primary" onClick={handleImport}>Confirm Import</Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
};
