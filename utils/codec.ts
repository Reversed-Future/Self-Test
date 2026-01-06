
import { QuizSet, QuestionType, Question, Option } from '../types';

/**
 * Mapping for minified keys to save space in the JSON before compression
 */
const KEY_MAP: Record<string, string> = {
  id: 'i',
  title: 't',
  description: 'd',
  createdAt: 'c',
  questions: 'q',
  type: 'ty',
  text: 'tx',
  options: 'o',
  correctAnswers: 'ca',
  subjectiveReference: 'sr',
  explanation: 'ex',
  points: 'p'
};

const TYPE_MAP: Record<string, number> = {
  [QuestionType.SINGLE_CHOICE]: 0,
  [QuestionType.MULTIPLE_CHOICE]: 1,
  [QuestionType.FILL_IN_THE_BLANK]: 2,
  [QuestionType.TRUE_FALSE]: 3,
  [QuestionType.SUBJECTIVE]: 4,
};

const REV_TYPE_MAP: Record<number, QuestionType> = Object.fromEntries(
  Object.entries(TYPE_MAP).map(([k, v]) => [v, k as QuestionType])
);

/**
 * Converts a QuizSet to a minified object for transport
 */
const toMinified = (quiz: QuizSet) => {
  return {
    [KEY_MAP.id]: quiz.id,
    [KEY_MAP.title]: quiz.title,
    [KEY_MAP.description]: quiz.description,
    [KEY_MAP.createdAt]: quiz.createdAt,
    [KEY_MAP.questions]: quiz.questions.map(q => {
      const isChoice = q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE;
      
      return {
        [KEY_MAP.id]: q.id,
        [KEY_MAP.type]: TYPE_MAP[q.type],
        [KEY_MAP.text]: q.text,
        [KEY_MAP.points]: q.points,
        // 升级优化：选择题的选项改为字符串数组，减少冗余 ID 字段
        [KEY_MAP.options]: isChoice 
          ? q.options?.map(o => o.text)
          : q.options?.map(o => ({
              [KEY_MAP.id]: o.id,
              [KEY_MAP.text]: o.text
            })),
        // 升级优化：选择题的正确答案改为数字索引数组
        [KEY_MAP.correctAnswers]: isChoice
          ? q.correctAnswers.map(ansId => q.options?.findIndex(o => o.id === ansId) ?? -1).filter(idx => idx !== -1)
          : q.correctAnswers,
        [KEY_MAP.subjectiveReference]: q.subjectiveReference,
        [KEY_MAP.explanation]: q.explanation
      };
    })
  };
};

/**
 * Converts a minified object back to a QuizSet
 */
const fromMinified = (min: any): QuizSet => {
  return {
    id: min[KEY_MAP.id],
    title: min[KEY_MAP.title],
    description: min[KEY_MAP.description],
    createdAt: min[KEY_MAP.createdAt],
    questions: (min[KEY_MAP.questions] as any[]).map(q => {
      const type = REV_TYPE_MAP[q[KEY_MAP.type]];
      const isChoice = type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE;
      
      const rawOptions = q[KEY_MAP.options];
      const rawAnswers = q[KEY_MAP.correctAnswers];
      
      let options: Option[] | undefined = undefined;
      let correctAnswers: string[] = Array.isArray(rawAnswers) ? rawAnswers.map(String) : [];

      if (isChoice && Array.isArray(rawOptions)) {
        // 探测是否为新版 V2 格式（字符串数组）
        if (rawOptions.length > 0 && typeof rawOptions[0] === 'string') {
          // 重新构造 Option 对象，并分配基于索引的 ID
          options = rawOptions.map((text: string, idx: number) => ({
            id: (idx + 1).toString(),
            text
          }));
          // 将数字索引映射回字符串 ID
          correctAnswers = (rawAnswers as number[]).map(idx => (idx + 1).toString());
        } else {
          // 向后兼容：旧版 V2 格式（对象数组）
          options = rawOptions.map((o: any) => ({
            id: o[KEY_MAP.id] || '',
            text: o[KEY_MAP.text] || ''
          }));
          correctAnswers = (rawAnswers as any[]).map(String);
        }
      } else if (rawOptions) {
        // 其他可能带选项的题型 fallback
        options = rawOptions.map((o: any) => ({
          id: o[KEY_MAP.id] || '',
          text: o[KEY_MAP.text] || ''
        }));
      }

      return {
        id: q[KEY_MAP.id],
        type,
        text: q[KEY_MAP.text],
        points: q[KEY_MAP.points],
        options,
        correctAnswers,
        subjectiveReference: q[KEY_MAP.subjectiveReference],
        explanation: q[KEY_MAP.explanation]
      } as Question;
    })
  } as QuizSet;
};

/**
 * Converts a Uint8Array to a Base64 string safely
 */
const uint8ArrayToBase64 = (array: Uint8Array): string => {
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
};

/**
 * Converts a Base64 string back to a Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const consumeStream = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
};

/**
 * Encodes a QuizSet into a Compressed Base64 string (V2 uses field minification)
 */
export const encodeQuizKey = async (quiz: QuizSet): Promise<string> => {
  try {
    const minified = toMinified(quiz);
    const jsonStr = JSON.stringify(minified);
    const uint8 = new TextEncoder().encode(jsonStr);
    
    const stream = new Blob([uint8 as any]).stream();
    const compressionStream = new CompressionStream('deflate');
    const compressedStream = stream.pipeThrough(compressionStream);
    
    const compressedBuffer = await consumeStream(compressedStream);
    // Prefix with 'v2.' to identify the new format
    return 'v2.' + uint8ArrayToBase64(compressedBuffer);
  } catch (e) {
    console.error("Failed to encode quiz key", e);
    return '';
  }
};

/**
 * Decodes a Compressed Share Key back into a QuizSet
 */
export const decodeQuizKey = async (key: string): Promise<QuizSet | null> => {
  try {
    const isV2 = key.startsWith('v2.');
    const actualKey = isV2 ? key.substring(3) : key;
    
    const compressedData = base64ToUint8Array(actualKey);
    const stream = new Blob([compressedData as any]).stream();
    const decompressionStream = new DecompressionStream('deflate');
    const decompressedStream = stream.pipeThrough(decompressionStream);
    
    const decompressedBuffer = await consumeStream(decompressedStream);
    const jsonStr = new TextDecoder().decode(decompressedBuffer);
    
    const parsed = JSON.parse(jsonStr);
    
    if (isV2) {
      return fromMinified(parsed);
    }
    
    // Legacy V1 support
    return parsed as QuizSet;
  } catch (e: any) {
    console.error("Failed to decode quiz key", e.message || e);
    return null;
  }
};
