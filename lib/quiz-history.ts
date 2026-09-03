export type QuizResultQuestion = {
  prompt: string;
  choices: string[];
  correctAnswer: number;
  selectedAnswer: number;
};

export type QuizHistoryEntry = {
  id: string;
  completedAt: string;
  score: number;
  totalQuestions: number;
  difficulty: string;
  questionType: string;
  questions: QuizResultQuestion[];
};

export const QUIZ_HISTORY_KEY = 'recall-quiz-history';

export function readQuizHistory(): QuizHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = window.localStorage.getItem(QUIZ_HISTORY_KEY);
    return saved ? (JSON.parse(saved) as QuizHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveQuizResult(result: QuizHistoryEntry) {
  const history = readQuizHistory();
  window.localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify([result, ...history]));
}

