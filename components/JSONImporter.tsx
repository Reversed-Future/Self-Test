
import React, { useState } from 'react';
import { Button } from './Button';
import { QuizSet, Question, QuestionType, Option } from '../types';

interface JSONImporterProps {
  onImport: (data: Partial<QuizSet>) => void;
  onClose: () => void;
}

export const JSONImporter: React.FC<JSONImporterProps> = ({ onImport, onClose }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const normalizeImportData = (raw: any): Partial<QuizSet> => {
    if (!raw.questions || !Array.isArray(raw.questions)) return raw;

    const normalizedQuestions = raw.questions.map((q: any) => {
      const isChoice = q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE;
      
      // 处理选项：如果提供的是字符串数组，转换为对象数组
      let finalOptions: Option[] | undefined = undefined;
      if (isChoice && Array.isArray(q.options)) {
        if (typeof q.options[0] === 'string') {
          finalOptions = q.options.map((text: string, idx: number) => ({
            id: (idx + 1).toString(),
            text
          }));
        } else {
          finalOptions = q.options;
        }
      } else {
        finalOptions = q.options;
      }

      // 处理答案：如果是数字索引，转换为对应的字符串 ID
      let finalAnswers: string[] = q.correctAnswers || [];
      if (isChoice && Array.isArray(q.correctAnswers) && typeof q.correctAnswers[0] === 'number') {
        finalAnswers = q.correctAnswers.map((idx: number) => (idx + 1).toString());
      } else if (Array.isArray(q.correctAnswers)) {
        finalAnswers = q.correctAnswers.map(String);
      }

      return {
        ...q,
        id: q.id || Math.random().toString(36).substr(2, 9),
        options: finalOptions,
        correctAnswers: finalAnswers
      };
    });

    return { ...raw, questions: normalizedQuestions };
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error("无效的 JSON：必须是一个对象。");
      }

      let importData: any = Array.isArray(parsed) ? { questions: parsed } : parsed;
      const normalizedData = normalizeImportData(importData);

      onImport(normalizedData);
      onClose();
    } catch (e: any) {
      setError(e.message || "JSON 解析失败，请检查格式是否正确（注意标点符号）。");
    }
  };

  const exampleJson = JSON.stringify({
    title: "V2 简化格式示例",
    description: "现在支持直接使用字符串数组定义选项和索引定义答案",
    questions: [
      {
        type: QuestionType.SINGLE_CHOICE,
        text: "太阳系中哪颗行星体积最大？",
        points: 5,
        options: ["地球", "火星", "木星", "土星"],
        correctAnswers: [2] // 索引 2 对应 "木星"
      },
      {
        type: QuestionType.MULTIPLE_CHOICE,
        text: "以下哪些属于编程语言？",
        points: 10,
        options: ["TypeScript", "HTML", "Python", "JSON"],
        correctAnswers: [0, 2] // 索引 0, 2 对应 TS 和 Python
      },
      {
        type: QuestionType.FILL_IN_THE_BLANK,
        text: "床前明月光，___。举头望明月，___。",
        points: 10,
        correctAnswers: ["疑是地上霜", "低头思故乡"]
      }
    ]
  }, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-8 max-w-5xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">导入 JSON 数据</h3>
            <p className="text-slate-500">支持 V2 简化格式（选项数组化、答案索引化）</p>
          </div>
        </div>

        <div className="flex-grow flex flex-col gap-4 overflow-hidden mb-6">
          <div className="relative min-h-[600px]">
            <textarea 
              className={`w-full h-full p-8 font-mono text-sm leading-relaxed rounded-xl border ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none shadow-inner z-10 relative`}
              placeholder=""
              style={{ backgroundColor: jsonText ? 'white' : 'transparent' }}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                if (error) setError(null);
              }}
            />
            {!jsonText && (
              <div className="absolute inset-0 p-8 pointer-events-none opacity-40 overflow-y-auto scrollbar-hide">
                <div className="border-b border-slate-200 pb-2 mb-4">
                  <span className="block text-slate-500 font-black uppercase text-[12px] tracking-widest">推荐 JSON 编写格式 (V2 Optimized):</span>
                </div>
                <pre className="text-xs font-mono leading-relaxed text-slate-500">{exampleJson}</pre>
              </div>
            )}
          </div>
          {error && (
            <div className="p-4 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-3 animate-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <span className="font-bold block">解析失败</span>
                <span className="opacity-90">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button className="flex-grow py-5 text-lg shadow-xl shadow-indigo-100" variant="primary" onClick={handleImport}>确认导入试卷</Button>
          <Button variant="ghost" className="px-8" onClick={onClose}>取消</Button>
        </div>
      </div>
    </div>
  );
};
