
import React, { useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface DevDocsProps {
  onClose: () => void;
}

export const DevDocs: React.FC<DevDocsProps> = ({ onClose }) => {
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const mdContent = `
# QuizGenius 题目密钥生成规范 v1.0

## 数据结构 (JSON)
\`\`\`json
{
  "id": "unique-string",
  "title": "Title",
  "questions": [...]
}
\`\`\`

## 编码流程
1. **JSON.stringify**
2. **UTF-8 Encoding**
3. **ZLIB Compression** (Deflate)
4. **Base64 Encoding**
  `;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Dialog 
        isOpen={showCopyAlert} 
        onClose={() => setShowCopyAlert(false)} 
        title="Copied!" 
        message="The specification has been copied to your clipboard in Markdown format." 
        type="success" 
      />
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Developer Guide</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-8 prose prose-slate max-w-none font-mono text-sm">
          <pre className="bg-slate-900 text-slate-100 p-6 rounded-2xl">{mdContent}</pre>
        </div>
        <div className="p-6 border-t flex gap-3">
          <Button variant="primary" className="flex-grow" onClick={() => {
            navigator.clipboard.writeText(mdContent);
            setShowCopyAlert(true);
          }}>Copy Specification</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
