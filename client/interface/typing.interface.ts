export interface WordSet {
  id: number;
  name: string;
  words: string[];
  isOfficial: boolean;
  createdAt: string;
}

// 后端返回的原始数据结构
export interface RawWordSet {
  id: number;
  name: string;
  words: string;
  is_official: boolean;
  created_at: string;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  startTime: number | null;
  endTime: number | null;
}

export interface HistoryItem {
  word: string;
  correct: boolean;
  time: number;
}