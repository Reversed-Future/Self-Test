
import React from 'react';
import { Button } from './Button';

interface DevDocsProps {
  onClose: () => void;
}

export const DevDocs: React.FC<DevDocsProps> = ({ onClose }) => {
  const mdContent = `
# QuizGenius 题目密钥生成规范 v1.0

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
3. **ZLIB 压缩**: 使用标准的 ZLIB 算法（RFC 1950，浏览器对应 'deflate'）压缩字节流。
4. **Base64 编码**: 将压缩后的二进制数据转为 Base64 字符串。

## 3. 实现示例 (Node.js)

\`\`\`javascript
const zlib = require('zlib');

function generateKey(quizObj) {
  const jsonStr = JSON.stringify(quizObj);
  // 使用 zlib.deflateSync 生成标准的 ZLIB 格式（包含 Header）
  const compressed = zlib.deflateSync(Buffer.from(jsonStr, 'utf8'));
  return compressed.toString('base64');
}
\`\`\`
  `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mdContent);
    alert("Specification copied as Markdown!");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">开发者与出题人指南</h2>
            <p className="text-sm text-slate-500">外部生成 QuizGenius 兼容密钥的标准说明</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 prose prose-slate max-w-none">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <p className="text-indigo-700 text-sm font-medium m-0">
              💡 提示：本软件使用浏览器原生的 <code>CompressionStream('deflate')</code> 接口，这对应于标准的 <b>ZLIB (RFC 1950)</b> 格式。
            </p>
          </div>
          
          <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
            {mdContent}
          </pre>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <Button variant="primary" className="flex-grow" onClick={copyToClipboard}>复制 Markdown 文档</Button>
          <Button variant="ghost" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};
