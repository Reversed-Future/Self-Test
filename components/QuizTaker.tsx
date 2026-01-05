
import React, { useState } from 'react';
import { QuizSet, UserAnswers, QuestionType, GradeResult } from '../types';
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
          isCorrect = true; score = 0;
          break;
      }
      return { questionId: q.id, isCorrect, score, maxScore: q.points };
    });
    setGrades(results);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answeredCount = quiz.questions.filter(q => {
    const val = answers[q.id];
    return val !== undefined && (Array.isArray(val) ? val.length > 0 : val.trim().length > 0);
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
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{isSubmitted ? 'Test Report: ' : ''}{quiz.title}</h1>
          <p className="text-slate-500">{quiz.description}</p>
        </div>

        <div className="space-y-12">
          {quiz.questions.map((q, idx) => {
            const grade = grades.find(g => g.questionId === q.id);
            return (
              <div key={q.id} id={`q-container-${q.id}`} className="space-y-4">
                <QuestionRenderer
                  question={q} index={idx}
                  answer={answers[q.id] || (q.type === QuestionType.MULTIPLE_CHOICE ? [] : '')}
                  onChange={(val) => handleAnswerChange(q.id, val)}
                  isGraded={isSubmitted}
                  isConfused={confusedIds.has(q.id)}
                  onToggleConfusion={() => toggleConfusion(q.id)}
                />
                {isSubmitted && (
                  <div className={`p-6 rounded-2xl border ${grade?.isCorrect || q.type === QuestionType.SUBJECTIVE ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <div className="flex justify-between items-center mb-4">
                       <span className="font-bold">{q.type === QuestionType.SUBJECTIVE ? 'Subjective Check' : (grade?.isCorrect ? '✓ CORRECT' : '✗ INCORRECT')}</span>
                       <span className="text-sm font-bold">Score: {grade?.score} / {grade?.maxScore}</span>
                    </div>
                    {q.type !== QuestionType.SUBJECTIVE ? (
                      <div className="text-sm opacity-80">Correct Answer: {q.correctAnswers.join(' / ')}</div>
                    ) : (
                      <div className="text-sm">Reference: {q.subjectiveReference}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <aside className="w-full lg:w-72 lg:sticky lg:top-24 z-30 order-first lg:order-last">
        <div className="bg-white rounded-2xl border p-6 shadow-xl space-y-6">
          <div>
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{isSubmitted ? 'Score' : 'Progress'}</h3>
             <div className="text-2xl font-black text-indigo-600">
               {isSubmitted ? `${totalScore} / ${maxScore}` : `${answeredCount} / ${quiz.questions.length}`}
             </div>
          </div>
          <div className="flex flex-col gap-2">
             {!isSubmitted ? (
               <Button variant="primary" className="w-full py-4" onClick={calculateGrade}>Submit Quiz</Button>
             ) : (
               <Button variant="primary" className="w-full" onClick={onExit}>Finish Review</Button>
             )}
             <Button variant="ghost" onClick={() => setShowExitConfirm(true)}>Exit</Button>
          </div>
        </div>
      </aside>
    </div>
  );
};
