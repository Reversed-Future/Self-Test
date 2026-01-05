
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QuizSet } from './types';
import { QuizCard } from './components/QuizCard';
import { QuizEditor } from './components/QuizEditor';
import { QuizTaker } from './components/QuizTaker';
import { Button } from './components/Button';
import { QRScanner } from './components/QRScanner';
import { DevDocs } from './components/DevDocs';
import { encodeQuizKey, decodeQuizKey } from './utils/codec';

type ViewState = 'HOME' | 'CREATE' | 'QUIZ' | 'EDIT';

export default function App() {
  const [quizzes, setQuizzes] = useState<QuizSet[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [sessionQuiz, setSessionQuiz] = useState<QuizSet | null>(null);
  const [importKey, setImportKey] = useState('');
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showStartPrompt, setShowStartPrompt] = useState<QuizSet | null>(null);
  const [showRandomPrompt, setShowRandomPrompt] = useState<QuizSet | null>(null);
  const [randomN, setRandomN] = useState<number>(5);
  const [showDevDocs, setShowDevDocs] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('my_quizzes');
    if (saved) {
      try {
        setQuizzes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load quizzes", e);
      }
    }
  }, []);

  // Save to localStorage whenever quizzes change
  useEffect(() => {
    localStorage.setItem('my_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  // Handle generating share key when modal opens
  useEffect(() => {
    if (showShareModal) {
      const quiz = quizzes.find(q => q.id === showShareModal);
      if (quiz) {
        setQrError(null);
        encodeQuizKey(quiz).then(key => {
          setGeneratedKey(key);
        });
      }
    } else {
      setGeneratedKey('');
      setQrError(null);
    }
  }, [showShareModal, quizzes]);

  // Handle drawing the QR Code when the key is generated and canvas is available
  useEffect(() => {
    if (generatedKey && qrCanvasRef.current) {
      // Use Error Correction Level 'L' (Low) to maximize data capacity
      QRCode.toCanvas(qrCanvasRef.current, generatedKey, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#4f46e5', // Indigo-600
          light: '#ffffff'
        }
      }, (error) => {
        if (error) {
          console.error("QR Code generation error", error);
          setQrError("This quiz is too large to be shared via QR code. Please use the Text Key instead.");
        }
      });
    }
  }, [generatedKey]);

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
        alert("This quiz is already in your library.");
      } else {
        setQuizzes([decoded, ...quizzes]);
        setImportKey('');
        alert(`Successfully imported: ${decoded.title}`);
        return true;
      }
    } else {
      alert("Invalid share key or QR code. The data might be corrupted.");
    }
    return false;
  };

  const handleImport = () => performImport(importKey);

  const onQRScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    await performImport(decodedText);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      setQuizzes(quizzes.filter(q => q.id !== id));
    }
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
      title: `${quiz.title} (Random ${n})`,
      questions: selected 
    };
    
    setSessionQuiz(quizToRun);
    setCurrentView('QUIZ');
    setShowRandomPrompt(null);
  };

  const renderHome = () => (
    <div className="space-y-12">
      {/* Header Section */}
      <section className="text-center py-12 px-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl shadow-indigo-100">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Master Your Knowledge</h1>
        <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">Create custom self-test sets, import community shared tests, and track your progress with professional auto-grading.</p>
        
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-2xl">
            <Button size="lg" variant="success" className="shadow-lg px-8" onClick={() => setCurrentView('CREATE')}>Create New Quiz</Button>
            
            <div className="flex-grow flex border border-white/20 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-1">
              <input 
                type="text" 
                placeholder="Paste Share Key..." 
                className="bg-transparent px-4 py-2 outline-none text-white placeholder-indigo-200 w-full"
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
              />
              <Button variant="secondary" className="rounded-lg mr-1" onClick={handleImport} isLoading={isImporting}>Import</Button>
              <Button 
                variant="ghost" 
                className="bg-white/20 text-white hover:bg-white/30 rounded-lg p-2" 
                title="Scan QR Code"
                onClick={() => setIsScanning(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              </Button>
            </div>
          </div>
          <p className="text-xs text-indigo-200">Tip: Click the QR icon to import via camera scanning</p>
        </div>
      </section>

      {/* Library Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800">My Library</h2>
          <span className="text-slate-400 text-sm font-medium">{quizzes.length} Quizzes Saved</span>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="mb-4 text-slate-300">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.246.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <p className="text-slate-400 text-lg">Your library is empty. Create your first quiz above!</p>
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

      {/* QR Scanner */}
      {isScanning && (
        <QRScanner onScanSuccess={onQRScanSuccess} onClose={() => setIsScanning(false)} />
      )}

      {/* Dev Docs */}
      {showDevDocs && (
        <DevDocs onClose={() => setShowDevDocs(false)} />
      )}

      {/* Start Quiz Prompt Modal */}
      {showStartPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to start?</h3>
            <p className="text-slate-500 text-sm mb-6">Would you like to shuffle the questions for this test session?</p>
            
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full py-3 text-lg" 
                onClick={() => startQuizSession(showStartPrompt, true)}
              >
                Yes, Shuffle Questions
              </Button>
              <Button 
                variant="secondary" 
                className="w-full py-3" 
                onClick={() => startQuizSession(showStartPrompt, false)}
              >
                No, Use Original Order
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowStartPrompt(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Random N Modal */}
      {showRandomPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Randomly Extract Questions</h3>
            <p className="text-slate-500 text-sm mb-6">Enter how many questions you want to extract from the total {showRandomPrompt.questions.length}.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Number of Questions (N)</label>
                <input 
                  type="number" 
                  min="1" 
                  max={showRandomPrompt.questions.length}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-center text-2xl font-bold text-indigo-600"
                  value={randomN}
                  onChange={(e) => setRandomN(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Button 
                  variant="primary" 
                  className="w-full py-3" 
                  onClick={() => startRandomQuizSession(showRandomPrompt, randomN)}
                  disabled={randomN < 1 || randomN > showRandomPrompt.questions.length}
                >
                  Start Random Test
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setShowRandomPrompt(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Share This Quiz</h3>
            <p className="text-slate-500 text-sm mb-6 text-center">Others can scan this code or use the text key to import.</p>
            
            <div className="flex flex-col items-center justify-center mb-6 min-h-[300px]">
              {qrError ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center max-w-xs">
                  <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium">{qrError}</p>
                </div>
              ) : (
                <div className="p-2 bg-white border-4 border-indigo-50 rounded-2xl">
                  <canvas ref={qrCanvasRef} className="w-full max-w-[320px] h-auto aspect-square"></canvas>
                  {!generatedKey && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                       <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 relative group">
              {generatedKey ? (
                <>
                  <textarea 
                    readOnly 
                    className="w-full bg-transparent text-[10px] font-mono break-all focus:outline-none h-20 resize-none"
                    value={generatedKey}
                  />
                  <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-white px-2 py-1 rounded text-xs font-bold text-indigo-600 shadow-sm">Text Key</span>
                  </div>
                </>
              ) : (
                <div className="h-20 flex items-center justify-center text-slate-400">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing data...
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                variant="primary" 
                className="flex-grow" 
                disabled={!generatedKey}
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  alert("Key copied to clipboard!");
                }}
              >
                Copy Text Key
              </Button>
              <Button variant="ghost" onClick={() => setShowShareModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 h-16 sticky top-0 z-30 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('HOME')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Quiz<span className="text-indigo-600">Genius</span></span>
          </div>
          {currentView !== 'HOME' && (
             <Button variant="ghost" size="sm" onClick={() => setCurrentView('HOME')}>Back to Home</Button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CREATE' && (
          <QuizEditor 
            onSave={handleSaveQuiz} 
            onCancel={() => setCurrentView('HOME')} 
          />
        )}
        {currentView === 'QUIZ' && sessionQuiz && (
          <QuizTaker 
            quiz={sessionQuiz} 
            onExit={() => { setCurrentView('HOME'); setSessionQuiz(null); }} 
          />
        )}
      </main>

      <footer className="py-10 text-center border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">&copy; 2024 QuizGenius. Built for lifelong learners.</p>
          <div className="flex gap-6">
            <button 
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
              onClick={() => setShowDevDocs(true)}
            >
              出题人指南 / Developer Docs
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-slate-400 hover:text-slate-600 text-sm">Gemini Billing Info</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
