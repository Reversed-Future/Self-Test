
import React, { useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface DevDocsProps {
  onClose: () => void;
}

export const DevDocs: React.FC<DevDocsProps> = ({ onClose }) => {
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const mdContent = `# QuizGenius 题目密钥生成规范 v2.5 (V2 算法优化版)

为了确保题目能被 QuizGenius 完美识别并实现最大化压缩（降低 15% 体积），请遵循本规范。

## 1. 核心数据结构 (JSON) - 推荐格式
\`\`\`json
{
  "id": "quiz-001",
  "title": "V2 优化示例",
  "questions": [
    {
      "type": "SINGLE_CHOICE",
      "text": "以下哪个是 V2 协议的改进？",
      "points": 5,
      "options": ["支持对象选项", "选项数组化", "不支持 V1"],
      "correctAnswers": [1] // 使用索引映射，1 代表 "选项数组化"
    },
    {
      "type": "FILL_IN_THE_BLANK", 
      "text": "法国的首都是___。",
      "points": 10,
      "correctAnswers": ["巴黎|Paris"]
    }
  ]
}
\`\`\`

## 2. 选择题优化 (Choice Optimization)
- **选项 (options)**: 不再强制要求 \`{"id": "1", "text": "..."}\`。直接传入字符串数组 \`["A", "B", "C"]\`，系统将自动分配 ID。
- **答案 (correctAnswers)**: 
  - 推荐使用数字数组（索引值，从 0 开始）。例如 \`[0, 2]\` 表示选中第 1 和第 3 个选项。
  - 依然兼容字符串 ID 数组（如 \`["1", "3"]\`）。

## 3. 填空题特殊逻辑
- **多空支持**: \`correctAnswers\` 数组的长度代表空格数量。
- **同义词支持**: 使用竖线 \`|\` 分隔（如：\`"巴黎|Paris"\`），匹配时不区分大小写且自动去除首尾空格。

## 4. 题型枚举 (QuestionType)
- \`SINGLE_CHOICE\`: 单选题
- \`MULTIPLE_CHOICE\`: 多选题
- \`FILL_IN_THE_BLANK\`: 填空题
- \`TRUE_FALSE\`: 判断题（答案固定为 \`["true"]\` 或 \`["false"]\`）
- \`SUBJECTIVE\`: 主观题

## 5. V2 压缩协议逻辑
应用会对 JSON 执行以下操作后生成 ShareKey：
1. **Minification**: 键名缩减（如 \`title\` → \`t\`）。
2. **Type Mapping**: 题型转为数字。
3. **Deflate**: 二进制流压缩。
4. **Base64**: 转为可传输文本并添加 \`v2.\` 前缀。

*注：JSON 导入功能完全兼容手动编写的 V2 简化格式。*
`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Dialog 
        isOpen={showCopyAlert} 
        onClose={() => setShowCopyAlert(false)} 
        title="已复制!" 
        message="新版规范内容已复制到剪贴板。" 
        type="success" 
      />
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded">DOCS</span>
            <h2 className="text-xl font-bold text-slate-800">出题人指南 v2.5</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-8 prose prose-slate max-w-none text-sm">
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <div>
               <strong>算法升级：</strong> V2 简化协议已启用。选择题现在可以使用<strong>字符串数组</strong>定义选项，并使用<strong>数字索引</strong>定义答案，导入速度更快。
             </div>
          </div>
          <pre className="bg-slate-900 text-slate-100 p-8 rounded-2xl whitespace-pre-wrap font-mono overflow-x-auto text-[13px] leading-relaxed border-4 border-slate-800 shadow-inner">{mdContent}</pre>
        </div>
        <div className="p-6 border-t flex gap-3 bg-slate-50">
          <Button variant="primary" className="flex-grow py-4" onClick={() => {
            navigator.clipboard.writeText(mdContent);
            setShowCopyAlert(true);
          }}>复制新版规范内容</Button>
          <Button variant="ghost" className="px-10" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};
