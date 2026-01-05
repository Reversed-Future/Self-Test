
import React, { useState, useEffect } from 'react';
import { QuizSet, UserAnswers, QuestionType, GradeResult } from '../types';
import { Button } from './Button';
import { QuestionRenderer } from './QuestionRenderer';

interface QuizTakerProps {
  quiz: QuizSet;
  onExit: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onExit }) => {
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [grades, setGrades] = useState<GradeResult[]>([]);

  const handleAnswerChange = (qId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const isQuestionAnswered = (qId: string): boolean => {
    const val = answers[qId];
    if (val === undefined || val === null) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') return val.trim().length > 0;
    return false;
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
          isCorrect = true; // Subjective always counts as "completed" but needs manual checking
          score = 0; // Not auto-graded
          break;
      }

      return {
        questionId: q.id,
        isCorrect,
        score,
        maxScore: q.points,
      };
    });

    setGrades(results);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToQuestion = (id: string) => {
    const el = document.getElementById(`q-container-${id}`);
    if (el) {
      const offset = 100; // Account for sticky header if any
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

  const answeredCount = quiz.questions.filter(q => isQuestionAnswered(q.id)).length;
  const progressPercent = Math.round((answeredCount / quiz.questions.length) * 100);

  const totalScore = grades.reduce((acc, g) => acc + g.score, 0);
  const maxPossible = quiz.questions.reduce((acc, q) => q.type !== QuestionType.SUBJECTIVE ? acc + q.points : acc, 0);

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto pb-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Results</h2>
          <p className="text-slate-500 mb-6">{quiz.title}</p>
          
          <div className="flex justify-center gap-12 mb-8">
            <div>
              <div className="text-4xl font-extrabold text-indigo-600">{totalScore}</div>
              <div className="text-sm text-slate-400 font-medium">Auto-graded Score</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-slate-700">{maxPossible}</div>
              <div className="text-sm text-slate-400 font-medium">Total Objective Points</div>
            </div>
          </div>
          
          <Button variant="primary" onClick={onExit}>Back to Library</Button>
        </div>

        <div className="space-y-6">
          {quiz.questions.map((q, idx) => {
            const grade = grades.find(g => g.questionId === q.id);
            return (
              <div key={q.id} className="relative">
                <QuestionRenderer
                  question={q}
                  index={idx}
                  answer={answers[q.id] || (q.type === QuestionType.MULTIPLE_CHOICE ? [] : '')}
                  onChange={() => {}}
                  isGraded={true}
                />
                <div className={`mt-3 p-4 rounded-xl border ${grade?.isCorrect || q.type === QuestionType.SUBJECTIVE ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                   <div className="flex justify-between items-center mb-2">
                     <span className="font-bold">
                       {q.type === QuestionType.SUBJECTIVE ? 'Subjective Question (Self-Review)' : (grade?.isCorrect ? '✓ Correct' : '✗ Incorrect')}
                     </span>
                     <span className="text-sm">
                       Score: {grade?.score} / {grade?.maxScore}
                     </span>
                   </div>
                   
                   {q.type !== QuestionType.SUBJECTIVE && (
                     <div className="text-sm">
                        <span className="font-semibold">Correct Answer(s):</span> {
                          q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE
                            ? q.options?.filter(o => q.correctAnswers.includes(o.id)).map(o => o.text).join(', ')
                            : q.correctAnswers.join(' / ')
                        }
                     </div>
                   )}

                   {q.type === QuestionType.SUBJECTIVE && (
                     <div className="space-y-2 text-sm">
                        <div><span className="font-semibold">Your Answer:</span> {answers[q.id] || '(No answer provided)'}</div>
                        <div className="p-3 bg-white rounded border border-emerald-200 mt-2">
                          <span className="font-semibold block mb-1">Reference Answer:</span>
                          <p className="whitespace-pre-wrap">{q.subjectiveReference || 'No reference answer provided.'}</p>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 pb-20 flex flex-col lg:flex-row gap-8 items-start">
      {/* Quiz Content */}
      <div className="w-full lg:max-w-4xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{quiz.title}</h1>
          <p className="text-slate-500">{quiz.description}</p>
        </div>

        <div className="space-y-12">
          {quiz.questions.map((q, idx) => (
            <div key={q.id} id={`q-container-${q.id}`}>
              <QuestionRenderer
                question={q}
                index={idx}
                answer={answers[q.id] || (q.type === QuestionType.MULTIPLE_CHOICE ? [] : '')}
                onChange={(val) => handleAnswerChange(q.id, val)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Status Sidebar */}
      <aside className="w-full lg:w-72 lg:sticky lg:top-24 z-30 order-first lg:order-last">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden backdrop-blur-sm bg-white/90">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Quiz Progress</h3>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500 font-medium">{answeredCount} of {quiz.questions.length} Answered</span>
              <span className="text-indigo-600 font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-5 gap-2 mb-6">
              {quiz.questions.map((q, idx) => {
                const answered = isQuestionAnswered(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    title={`Question ${idx + 1}`}
                    className={`h-10 w-full rounded-lg text-sm font-bold transition-all ${
                      answered 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full py-3 shadow-lg shadow-indigo-100" 
                onClick={calculateGrade}
              >
                Submit Quiz
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-slate-500 hover:text-red-500 hover:bg-red-50" 
                onClick={() => {
                  if(confirm("Are you sure you want to exit? Your progress will not be saved.")) {
                    onExit();
                  }
                }}
              >
                Exit Test
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
            Click a number to jump to that question
          </div>
        </div>
      </aside>
    </div>
  );
};
