
import React, { useState } from 'react';
import { QuizSet, UserAnswers, QuestionType, GradeResult, Question } from '../types';
import { Button } from './Button';
import { QuestionRenderer } from './QuestionRenderer';
import { Dialog } from './Dialog';

interface QuizTakerProps {
  quiz: QuizSet;
  onExit: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onExit }) => {
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [confusedIds, setConfusedIds] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [grades, setGrades] = useState<GradeResult[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleAnswerChange = (qId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const toggleConfusion = (qId: string) => {
    setConfusedIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-container-${id}`);
    if (el) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const calculateGrade = () => {
    const results: GradeResult[] = quiz.questions.map(q => {
      const userAns = answers[q.id];
      let isCorrect = false;
      let score = 0;
      switch (q.type) {
        case QuestionType.SINGLE_CHOICE:
        case QuestionType.TRUE_FALSE:
          isCorrect = userAns === q.correctAnswers[0];
          score = isCorrect ? q.points : 0;
          break;
        case QuestionType.MULTIPLE_CHOICE:
          const sortedCorrect = [...q.correctAnswers].sort().join(',');
          const sortedUser = Array.isArray(userAns) ? [...userAns].sort().join(',') : '';
          isCorrect = sortedCorrect === sortedUser;
          score = isCorrect ? q.points : 0;
          break;
        case QuestionType.FILL_IN_THE_BLANK:
          const normalizedUser = (userAns as string || '').trim().toLowerCase();
          isCorrect = q.correctAnswers.some(ans => ans.trim().toLowerCase() === normalizedUser);
          score = isCorrect ? q.points : 0;
          break;
        case QuestionType.SUBJECTIVE:
          isCorrect = true; 
          score = 0;
          break;
      }
      return { questionId: q.id, isCorrect, score, maxScore: q.points };
    });
    setGrades(results);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStandardAnswerDisplay = (q: Question) => {
    if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) {
      // Return full text of correct options
      return q.correctAnswers
        .map(ansId => q.options?.find(o => o.id === ansId)?.text || ansId)
        .join(', ');
    }
    return q.correctAnswers.join(' / ');
  };

  const answeredCount = quiz.questions.filter(q => {
    const val = answers[q.id];
    if (val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    return val.trim().length > 0;
  }).length;

  const totalScore = grades.reduce((acc, g) => acc + g.score, 0);
  const maxScore = quiz.questions.reduce((acc, q) => q.type !== QuestionType.SUBJECTIVE ? acc + q.points : acc, 0);

  return (
    <div className="relative max-w-7xl mx-auto px-4 pb-20 flex flex-col lg:flex-row gap-8 items-start animate-in fade-in duration-500">
      <Dialog 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={onExit}
        type="confirm"
        title="Exit Quiz?"
        message="Your progress will not be saved. Are you sure you want to end this session?"
        confirmText="Exit Session"
      />

      <div className="w-full lg:max-w-4xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
            {isSubmitted ? 'Test Report: ' : ''}{quiz.title}
          </h1>
          <p className="text-slate-500">{quiz.description}</p>
        </div>

        <div className="space-y-12">
          {quiz.questions.map((q, idx) => {
            const grade = grades.find(g => g.questionId === q.id);
            return (
              <div key={q.id} id={`q-container-${q.id}`} className="space-y-4">
                <QuestionRenderer
                  question={q} 
                  index={idx}
                  answer={answers[q.id] || (q.type === QuestionType.MULTIPLE_CHOICE ? [] : '')}
                  onChange={(val) => handleAnswerChange(q.id, val)}
                  isGraded={isSubmitted}
                  isConfused={confusedIds.has(q.id)}
                  onToggleConfusion={() => toggleConfusion(q.id)}
                />
                {isSubmitted && (
                  <div className={`p-6 rounded-2xl border ${
                    q.type === QuestionType.SUBJECTIVE 
                      ? 'bg-amber-50 border-amber-100 text-amber-800' 
                      : (grade?.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800')
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                       <span className="font-bold">
                         {q.type === QuestionType.SUBJECTIVE ? 'Subjective Reference' : (grade?.isCorrect ? '✓ CORRECT' : '✗ INCORRECT')}
                       </span>
                       <span className="text-sm font-bold">
                         Score: {grade?.score} / {grade?.maxScore}
                       </span>
                    </div>
                    {q.type !== QuestionType.SUBJECTIVE ? (
                      <div className="text-sm opacity-80 font-medium">
                        Standard Answer: <span>{getStandardAnswerDisplay(q)}</span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="font-bold block mb-1">Grading Reference:</span>
                        <p className="whitespace-pre-wrap opacity-90">{q.subjectiveReference || "No reference provided."}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigator Sidebar */}
      <aside className="w-full lg:w-80 lg:sticky lg:top-24 z-30 order-first lg:order-last">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-6">
          <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
               {isSubmitted ? 'Final Result' : 'Question Navigator'}
             </h3>
             
             {/* Question Grid */}
             <div className="grid grid-cols-5 gap-2 mb-6">
                {quiz.questions.map((q, idx) => {
                  const hasAnswer = answers[q.id] && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : (answers[q.id] as string).trim().length > 0);
                  const isConfused = confusedIds.has(q.id);
                  const grade = grades.find(g => g.questionId === q.id);

                  let statusClass = "bg-slate-50 text-slate-400 border-slate-100";
                  if (isSubmitted) {
                    if (q.type === QuestionType.SUBJECTIVE) statusClass = "bg-amber-500 text-white border-amber-600";
                    else if (grade?.isCorrect) statusClass = "bg-emerald-500 text-white border-emerald-600";
                    else statusClass = "bg-red-500 text-white border-red-600";
                  } else if (hasAnswer) {
                    statusClass = "bg-indigo-600 text-white border-indigo-700 shadow-sm";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(q.id)}
                      className={`relative h-10 w-full rounded-lg border text-xs font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${statusClass} ${isConfused ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      {idx + 1}
                      {isConfused && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full shadow-sm"></span>
                      )}
                    </button>
                  );
                })}
             </div>

             <div className="pt-4 border-t border-slate-50 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{isSubmitted ? 'Total Score' : 'Completion'}</span>
                  <span className="font-black text-indigo-600 text-lg">
                    {isSubmitted ? `${totalScore} / ${maxScore}` : `${answeredCount} / ${quiz.questions.length}`}
                  </span>
                </div>
                {!isSubmitted && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-500" 
                      style={{ width: `${(answeredCount / quiz.questions.length) * 100}%` }}
                    ></div>
                  </div>
                )}
             </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
             {!isSubmitted ? (
               <Button variant="primary" className="w-full py-4 shadow-lg shadow-indigo-100" onClick={calculateGrade}>
                 Submit Quiz
               </Button>
             ) : (
               <Button variant="primary" className="w-full py-4 shadow-lg shadow-emerald-100" onClick={onExit}>
                 Finish & Exit
               </Button>
             )}
             <Button variant="ghost" onClick={() => setShowExitConfirm(true)}>
               {isSubmitted ? 'Close Report' : 'Quit Session'}
             </Button>
          </div>
        </div>
      </aside>
    </div>
  );
};
