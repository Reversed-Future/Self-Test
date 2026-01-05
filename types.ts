
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  TRUE_FALSE = 'TRUE_FALSE',
  SUBJECTIVE = 'SUBJECTIVE',
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[]; 
  correctAnswers: string[]; 
  subjectiveReference?: string; 
  explanation?: string;
  points: number;
}

export interface QuizSet {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  questions: Question[];
}

export type UserAnswers = Record<string, string | string[]>;

export interface GradeResult {
  questionId: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback?: string;
}
