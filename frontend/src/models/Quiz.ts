export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  status: "draft" | "assigned" | "pending_validation" | "validated" | "rejected";
  questionCount: number;
  classIds: number[];
}

export interface CreateQuizRequest {
  title: string;
  questions: QuizQuestion[];
}

export interface QuizValidationRequest {
  quizId: string;
  message: string;
}
