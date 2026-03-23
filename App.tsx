
import React, { useState, useEffect } from 'react';
import { QuizSet } from './types';
import { QuizCard } from './components/QuizCard';
import { QuizEditor } from './components/QuizEditor';
import { QuizTaker } from './components/QuizTaker';
import { Button } from './components/Button';
import { DevDocs } from './components/DevDocs';
import { Dialog, DialogType } from './components/Dialog';
import { encodeQuizKey, decodeQuizKey } from './utils/codec';

type ViewState = 'HOME' | 'CREATE' | 'QUIZ' | 'EDIT';

export default function App() {
  const [quizzes, setQuizzes] = useState<QuizSet[]>(() => {
    const saved = localStorage.getItem('my_quizzes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load quizzes", e);
      }
    }
    return [];
  });
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [sessionQuiz, setSessionQuiz] = useState<QuizSet | null>(null);
  const [importKey, setImportKey] = useState('');
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showStartPrompt, setShowStartPrompt] = useState<QuizSet | null>(null);
  const [showRandomPrompt, setShowRandomPrompt] = useState<QuizSet | null>(null);
  const [randomN, setRandomN] = useState<number>(5);
  const [showDevDocs, setShowDevDocs] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: DialogType;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: DialogType = 'info') => {
    setDialog({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };
  
  useEffect(() => {
    localStorage.setItem('my_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    if (showShareModal) {
      const quiz = quizzes.find(q => q.id === showShareModal);
      if (quiz) {
        encodeQuizKey(quiz).then(key => {
          setGeneratedKey(key);
        });
      }
    } else {
      // Use a microtask to avoid synchronous state update in effect body
      Promise.resolve().then(() => setGeneratedKey(''));
    }
  }, [showShareModal, quizzes]);

  const handleSaveQuiz = (quiz: QuizSet) => {
    const exists = quizzes.find(q => q.id === quiz.id);
    if (exists) {
      setQuizzes(quizzes.map(q => q.id === quiz.id ? quiz : q));
    } else {
      setQuizzes([quiz, ...quizzes]);
    }
    setCurrentView('HOME');
    setSessionQuiz(null);
  };

  const performImport = async (key: string) => {
    if (!key.trim()) return;
    setIsImporting(true);
    const decoded = await decodeQuizKey(key.trim());
    setIsImporting(false);

    if (decoded) {
      if (quizzes.some(q => q.id === decoded.id)) {
        showAlert("重复试卷", "此试卷已在您的库中。", "warning");
      } else {
        setQuizzes([decoded, ...quizzes]);
        setImportKey('');
        showAlert("成功", `成功导入：${decoded.title}`, "success");
        return true;
      }
    } else {
      showAlert("导入失败", "无效的分享密钥。请确保您复制了完整的密钥。", "error");
    }
    return false;
  };

  const handleImport = () => performImport(importKey);

  const handleDelete = (id: string) => {
    showConfirm("删除试卷", "您确定要永久删除这套试卷吗？", () => {
      setQuizzes(quizzes.filter(q => q.id !== id));
    });
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const startQuizSession = (quiz: QuizSet, shuffle: boolean) => {
    const quizToRun = shuffle 
      ? { ...quiz, questions: shuffleArray(quiz.questions) } 
      : { ...quiz };
    
    setSessionQuiz(quizToRun);
    setCurrentView('QUIZ');
    setShowStartPrompt(null);
  };

  const startRandomQuizSession = (quiz: QuizSet, count: number) => {
    const total = quiz.questions.length;
    const n = Math.max(1, Math.min(count, total));
    const shuffled = shuffleArray(quiz.questions);
    const selected = shuffled.slice(0, n);
    
    const quizToRun = { 
      ...quiz, 
      title: `${quiz.title} (随机 ${n} 题)`,
      questions: selected 
    };
    
    setSessionQuiz(quizToRun);
    setCurrentView('QUIZ');
    setShowRandomPrompt(null);
  };

  const renderHome = () => (
    <div className="space-y-12">
      <section className="text-center py-16 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">掌握您的知识</h1>
        <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">创建自定义自测题集，导入社区测试，并通过专业的自动评分跟踪您的进度。</p>
        
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 w-full max-w-3xl">
            <Button size="lg" variant="success" className="shadow-lg px-8 h-[56px] whitespace-nowrap" onClick={() => setCurrentView('CREATE')}>
              创建新试卷
            </Button>
            
            <div className="flex-grow flex items-stretch border border-white/20 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm">
              <input 
                type="text" 
                placeholder="粘贴分享密钥..." 
                className="bg-transparent px-6 py-2 outline-none text-white placeholder-indigo-200 w-full text-base"
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
              />
              <div className="p-1 flex">
                <Button 
                  variant="secondary" 
                  className="rounded-lg px-6 h-full whitespace-nowrap border-none" 
                  onClick={handleImport} 
                  isLoading={isImporting}
                >
                  导入密钥
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">我的库</h2>
          <span className="text-slate-400 text-sm font-medium">已保存 {quizzes.length} 套试卷</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="mb-4 text-slate-300 text-6xl">📚</div>
            <p className="text-slate-400 text-lg">您的库是空的。在上方创建您的第一套试卷吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(quiz => (
              <QuizCard 
                key={quiz.id} 
                quiz={quiz} 
                onStart={(id) => { 
                  const q = quizzes.find(item => item.id === id);
                  if (q) setShowStartPrompt(q);
                }}
                onRandomStart={(id) => {
                  const q = quizzes.find(item => item.id === id);
                  if (q) {
                    setShowRandomPrompt(q);
                    setRandomN(Math.min(5, q.questions.length));
                  }
                }}
                onShare={(id) => setShowShareModal(id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 h-16 sticky top-0 z-30 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('HOME')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Quiz<span className="text-indigo-600">Genius</span></span>
          </div>
          {currentView !== 'HOME' && <Button variant="ghost" size="sm" onClick={() => setCurrentView('HOME')}>返回首页</Button>}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 flex-grow w-full">
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CREATE' && <QuizEditor onSave={handleSaveQuiz} onCancel={() => setCurrentView('HOME')} />}
        {currentView === 'QUIZ' && sessionQuiz && <QuizTaker quiz={sessionQuiz} onExit={() => { setCurrentView('HOME'); setSessionQuiz(null); }} />}
      </main>

      {/* Global Modals */}
      {showDevDocs && <DevDocs onClose={() => setShowDevDocs(false)} />}

      {/* Start Quiz Prompt Modal */}
      {showStartPrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-2">准备好开始了吗？</h3>
            <p className="text-slate-500 text-sm mb-6">您想在本次测试中打乱题目顺序吗？</p>
            <div className="space-y-3">
              <Button variant="primary" className="w-full py-3" onClick={() => startQuizSession(showStartPrompt, true)}>是的，打乱顺序</Button>
              <Button variant="secondary" className="w-full py-3" onClick={() => startQuizSession(showStartPrompt, false)}>不，使用原始顺序</Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowStartPrompt(null)}>取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">分享此试卷</h3>
            <p className="text-slate-500 text-xs mb-6 text-center">V2 超压缩密钥。复制并分享下方的密钥。</p>
            
            <div className="bg-slate-50 p-6 rounded-xl border mb-6 relative group overflow-hidden shadow-inner">
               <textarea 
                 readOnly 
                 className="w-full bg-transparent text-[10px] font-mono h-40 outline-none resize-none scrollbar-hide leading-relaxed text-slate-600" 
                 value={generatedKey} 
                 onClick={(e) => (e.target as HTMLTextAreaElement).select()}
               />
               <div className="absolute bottom-2 right-3 text-[8px] font-bold text-slate-400 uppercase tracking-widest">v2 压缩版</div>
            </div>

            <div className="flex gap-4">
              <Button className="flex-grow shadow-lg shadow-indigo-100 py-4" onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                showAlert("已复制", "超压缩密钥已复制到剪贴板！", "success");
              }}>复制密钥字符串</Button>
              <Button variant="ghost" className="px-8" onClick={() => setShowShareModal(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* Random Selection Prompt */}
      {showRandomPrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-800 mb-2">随机抽取</h3>
            <p className="text-slate-500 text-sm mb-6">从 {showRandomPrompt.questions.length} 道题中抽取 {randomN} 道题。</p>
            <input 
              type="number" min="1" max={showRandomPrompt.questions.length}
              className="w-full p-4 rounded-xl border text-center text-3xl font-bold text-indigo-600 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={randomN}
              onChange={(e) => setRandomN(parseInt(e.target.value) || 1)}
            />
            <div className="flex flex-col gap-2">
              <Button onClick={() => startRandomQuizSession(showRandomPrompt, randomN)}>开始随机测试</Button>
              <Button variant="ghost" onClick={() => setShowRandomPrompt(null)}>取消</Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Dialog */}
      <Dialog 
        isOpen={dialog.isOpen}
        onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />

      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>&copy; 2024 QuizGenius. 专业级自测平台。</p>
          <div className="flex gap-6">
            <button className="text-indigo-600 hover:underline font-semibold" onClick={() => setShowDevDocs(true)}>出题人指南</button>
          </div>
        </div>
      </footer>
    </div>
  );
}