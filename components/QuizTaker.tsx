
import React, { useState } from 'react';
import { QuizSet, UserAnswers, QuestionType, GradeResult } from '../types';
import { Button } from './Button';
import { QuestionRenderer } from './QuestionRenderer';

interface QuizTakerProps {
  quiz: QuizSet;
  onExit: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onExit }) => {
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [confusedIds, setConfusedIds] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [grades, setGrades] = useState<GradeResult[]>([]);

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
      const offset = 100;
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

  const renderSidebar = () => (
    <aside className="w-full lg:w-72 lg:sticky lg:top-24 z-30 order-first lg:order-last">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden backdrop-blur-sm bg-white/90">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            {isSubmitted ? 'Result Navigation' : 'Quiz Progress'}
          </h3>
          
          {!isSubmitted ? (
            <>
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
            </>
          ) : (
            <div className="space-y-1">
              <div className="text-lg font-bold text-indigo-600">Score: {totalScore} / {maxPossible}</div>
              <p className="text-[10px] text-slate-400">Click a number to review details</p>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {quiz.questions.map((q, idx) => {
              const answered = isQuestionAnswered(q.id);
              const confused = confusedIds.has(q.id);
              const grade = grades.find(g => g.questionId === q.id);
              
              let statusClass = "bg-slate-100 text-slate-400 hover:bg-slate-200";
              
              if (isSubmitted) {
                if (confused) {
                  statusClass = "bg-yellow-400 text-white shadow-md";
                } else if (q.type === QuestionType.SUBJECTIVE) {
                  statusClass = "bg-indigo-500 text-white shadow-md";
                } else if (grade?.isCorrect) {
                  statusClass = "bg-emerald-500 text-white shadow-md";
                } else {
                  statusClass = "bg-red-500 text-white shadow-md";
                }
              } else {
                if (confused) {
                  statusClass = "bg-yellow-400 text-white shadow-md";
                } else if (answered) {
                  statusClass = "bg-indigo-600 text-white shadow-md";
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.id)}
                  title={`Question ${idx + 1}`}
                  className={`h-10 w-full rounded-lg text-sm font-bold transition-all ${statusClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {!isSubmitted ? (
              <>
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
              </>
            ) : (
              <Button variant="primary" className="w-full py-3" onClick={onExit}>Finish Review</Button>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] space-y-2">
          <div className="flex items-center justify-center gap-4">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Correct</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Wrong</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Confused</div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="relative max-w-7xl mx-auto px-4 pb-20 flex flex-col lg:flex-row gap-8 items-start">
      {/* Quiz/Result Content */}
      <div className="w-full lg:max-w-4xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
            {isSubmitted ? 'Results: ' : ''}{quiz.title}
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
                  <div className={`p-4 rounded-xl border ${grade?.isCorrect || q.type === QuestionType.SUBJECTIVE ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold flex items-center gap-2">
                        {q.type === QuestionType.SUBJECTIVE ? 'Subjective Question (Self-Review)' : (grade?.isCorrect ? '✓ Correct' : '✗ Incorrect')}
                        {confusedIds.has(q.id) && <span className="bg-yellow-400 text-white text-[10px] px-2 py-0.5 rounded-full">Review Requested</span>}
                      </span>
                      <span className="text-sm">
                        Score: {grade?.score} / {grade?.maxScore}
                      </span>
                    </div>
                    
                    {q.type !== QuestionType.SUBJECTIVE && (
                      <div className="text-sm">
                        <span className="font-semibold">Correct Answer(s):</span> {
                          q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE
                            ? q.options?.filter(o => q.correctAnswers.includes(o.id)).map(o => o.text).join(', ') || q.correctAnswers.join(', ')
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
                )}
              </div>
            );
          })}
        </div>
      </div>

      {renderSidebar()}
    </div>
  );
};
