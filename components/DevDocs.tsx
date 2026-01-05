
import React, { useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface DevDocsProps {
  onClose: () => void;
}

export const DevDocs: React.FC<DevDocsProps> = ({ onClose }) => {
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const mdContent = `# QuizGenius 题目密钥生成规范 v1.0

为了确保外部生成的题目能被 QuizGenius 识别，请遵循以下标准流程。

## 1. 数据结构 (JSON)
所有题目必须封装在一个满足以下结构的 JSON 对象中：

\`\`\`json
{
  "id": "unique-string",
  "title": "测试标题",
  "description": "描述文本",
  "createdAt": 1700000000000,
  "questions": [
    {
      "id": "q1",
      "type": "SINGLE_CHOICE", // 可选: SINGLE_CHOICE, MULTIPLE_CHOICE, FILL_IN_THE_BLANK, TRUE_FALSE, SUBJECTIVE
      "text": "题目文本内容",
      "points": 5,
      "options": [ // 仅选择题需要
        { "id": "1", "text": "选项A" },
        { "id": "2", "text": "选项B" }
      ],
      "correctAnswers": ["1"], // 填空题填入所有可接受文本，判断题填入 "true" 或 "false"
      "subjectiveReference": "主观题参考答案"
    }
  ]
}
\`\`\`

## 2. 编码流程
生成的密钥必须按顺序执行以下转换：

1. **序列化**: 将对象转为 JSON 字符串。
2. **UTF-8 编码**: 将字符串转为二进制字节流。
3. **Deflate 压缩**: 使用标准的 Deflate 算法（RFC 1951）压缩字节流。
4. **Base64 编码**: 将压缩后的二进制数据转为 Base64 字符串。

## 3. 实现示例 (Node.js)

\`\`\`javascript
const zlib = require('zlib');

function generateKey(quizObj) {
  const jsonStr = JSON.stringify(quizObj);
  const compressed = zlib.deflateRawSync(Buffer.from(jsonStr, 'utf8'));
  return compressed.toString('base64');
}
\`\`\`
`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <Dialog 
        isOpen={showCopyAlert} 
        onClose={() => setShowCopyAlert(false)} 
        title="已复制!" 
        message="规范内容已复制到剪贴板。" 
        type="success" 
      />
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">出题人指南</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-8 prose prose-slate max-w-none text-sm">
          <pre className="bg-slate-900 text-slate-100 p-6 rounded-2xl whitespace-pre-wrap font-mono overflow-x-auto">{mdContent}</pre>
        </div>
        <div className="p-6 border-t flex gap-3">
          <Button variant="primary" className="flex-grow" onClick={() => {
            navigator.clipboard.writeText(mdContent);
            setShowCopyAlert(true);
          }}>复制规范内容</Button>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};
