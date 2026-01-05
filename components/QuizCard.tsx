
import React from 'react';
import { QuizSet } from '../types';
import { Button } from './Button';

interface QuizCardProps {
  quiz: QuizSet;
  onStart: (id: string) => void;
  onRandomStart: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart, onRandomStart, onShare, onDelete }) => {
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
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="primary" size="sm" onClick={() => onStart(quiz.id)}>Start Test</Button>
        <Button variant="secondary" size="sm" onClick={() => onRandomStart(quiz.id)}>Random N</Button>
        <Button variant="secondary" size="sm" onClick={() => onShare(quiz.id)}>Share Key</Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto" 
          onClick={() => onDelete(quiz.id)}
          title="Delete Quiz"
          aria-label="Delete Quiz"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </Button>
      </div>
    </div>
  );
};
