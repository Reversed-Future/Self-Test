
import React from 'react';
import { QuizSet } from '../types';
import { Button } from './Button';

interface QuizCardProps {
  quiz: QuizSet;
  onStart: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart, onShare, onDelete }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{quiz.title}</h3>
        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
          {quiz.questions.length} Questions
        </span>
      </div>
      <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">
        {quiz.description || "No description provided."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={() => onStart(quiz.id)}>Start Test</Button>
        <Button variant="secondary" size="sm" onClick={() => onShare(quiz.id)}>Share Key</Button>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(quiz.id)}>Delete</Button>
      </div>
    </div>
  );
};
