
import React from 'react';
import { Question, QuestionType } from '../types';

interface QuestionRendererProps {
  question: Question;
  index: number;
  answer: string | string[];
  onChange: (value: string | string[]) => void;
  isGraded?: boolean;
  isConfused?: boolean;
  onToggleConfusion?: () => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  index,
  answer,
  onChange,
  isGraded = false,
  isConfused = false,
  onToggleConfusion
}) => {
  const handleSingleChoice = (optionId: string) => {
    if (isGraded) return;
    onChange(optionId);
  };

  const handleMultipleChoice = (optionId: string) => {
    if (isGraded) return;
    const currentAnswers = Array.isArray(answer) ? answer : [];
    if (currentAnswers.includes(optionId)) {
      onChange(currentAnswers.filter(id => id !== optionId));
    } else {
      onChange([...currentAnswers, optionId]);
    }
  };

  const handleTrueFalse = (val: string) => {
    if (isGraded) return;
    onChange(val);
  };

  return (
    <div className={`p-6 rounded-xl bg-white border relative transition-all ${
      isGraded ? 'border-slate-200' : 'border-indigo-100 shadow-sm'
    } ${isConfused && !isGraded ? 'ring-2 ring-yellow-400 border-yellow-400' : ''}`}>
      
      {/* Confusion Toggle */}
      {!isGraded && onToggleConfusion && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleConfusion();
          }}
          title="Mark as confused / 标记为困惑"
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
            isConfused 
              ? 'bg-yellow-400 text-white border-yellow-500 shadow-md scale-110' 
              : 'bg-white text-slate-300 border-slate-200 hover:text-yellow-500 hover:border-yellow-300'
          }`}
        >
          <span className="font-bold text-lg">?</span>
        </button>
      )}

      {/* Confused Indicator in Graded view */}
      {isGraded && isConfused && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
          <span className="text-sm">?</span> Marked Confused
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
          {index + 1}
        </span>
        <div className="flex-grow pr-8">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
               {question.type.replace(/_/g, ' ')}
             </span>
             <span className="text-xs text-slate-400">• {question.points} pts</span>
          </div>
          <h4 className="text-lg font-medium text-slate-800 whitespace-pre-wrap">{question.text}</h4>
        </div>
      </div>

      <div className="ml-12 space-y-3">
        {question.type === QuestionType.SINGLE_CHOICE && question.options?.map(opt => (
          <label 
            key={opt.id} 
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              answer === opt.id 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-slate-200 hover:border-indigo-300'
            } ${isGraded ? 'pointer-events-none' : ''}`}
          >
            <input 
              type="radio" 
              name={`q-${question.id}`} 
              checked={answer === opt.id}
              onChange={() => handleSingleChoice(opt.id)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span className="ml-3 text-slate-700">{opt.text}</span>
          </label>
        ))}

        {question.type === QuestionType.MULTIPLE_CHOICE && question.options?.map(opt => (
          <label 
            key={opt.id} 
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              Array.isArray(answer) && answer.includes(opt.id) 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-slate-200 hover:border-indigo-300'
            } ${isGraded ? 'pointer-events-none' : ''}`}
          >
            <input 
              type="checkbox" 
              checked={Array.isArray(answer) && answer.includes(opt.id)}
              onChange={() => handleMultipleChoice(opt.id)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
            />
            <span className="ml-3 text-slate-700">{opt.text}</span>
          </label>
        ))}

        {question.type === QuestionType.TRUE_FALSE && (
          <div className="flex gap-4">
            {['true', 'false'].map(val => (
              <button
                key={val}
                onClick={() => handleTrueFalse(val)}
                className={`flex-1 py-3 px-4 rounded-lg border font-medium capitalize transition-all ${
                  answer === val 
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                } ${isGraded ? 'pointer-events-none' : ''}`}
              >
                {val}
              </button>
            ))}
          </div>
        )}

        {question.type === QuestionType.FILL_IN_THE_BLANK && (
          <input
            type="text"
            placeholder="Type your answer here..."
            value={answer as string || ''}
            onChange={(e) => !isGraded && onChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isGraded}
          />
        )}

        {question.type === QuestionType.SUBJECTIVE && (
          <textarea
            placeholder="Write your answer in detail..."
            rows={4}
            value={answer as string || ''}
            onChange={(e) => !isGraded && onChange(e.target.value)}
            className="w-full p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isGraded}
          />
        )}
      </div>
    </div>
  );
};
