
import { QuizSet } from '../types';

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

/**
 * Consumes a ReadableStream and returns a Uint8Array.
 * This avoids 'Failed to fetch' errors associated with using the Response object to consume streams.
 */
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
 * Encodes a QuizSet into a Compressed Base64 string
 */
export const encodeQuizKey = async (quiz: QuizSet): Promise<string> => {
  try {
    const jsonStr = JSON.stringify(quiz);
    const uint8 = new TextEncoder().encode(jsonStr);
    
    // Using native CompressionStream (Deflate / ZLIB)
    // Cast to any to avoid TypeScript errors with SharedArrayBuffer vs ArrayBuffer in strict environments
    const stream = new Blob([uint8 as any]).stream();
    const compressionStream = new CompressionStream('deflate');
    const compressedStream = stream.pipeThrough(compressionStream);
    
    const compressedBuffer = await consumeStream(compressedStream);
    return uint8ArrayToBase64(compressedBuffer);
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
    const compressedData = base64ToUint8Array(key);
    
    // Using native DecompressionStream
    // Cast to any to avoid TypeScript errors with SharedArrayBuffer vs ArrayBuffer in strict environments
    const stream = new Blob([compressedData as any]).stream();
    const decompressionStream = new DecompressionStream('deflate');
    const decompressedStream = stream.pipeThrough(decompressionStream);
    
    const decompressedBuffer = await consumeStream(decompressedStream);
    const jsonStr = new TextDecoder().decode(decompressedBuffer);
    
    return JSON.parse(jsonStr) as QuizSet;
  } catch (e: any) {
    console.error("Failed to decode quiz key", e.message || e);
    return null;
  }
};
