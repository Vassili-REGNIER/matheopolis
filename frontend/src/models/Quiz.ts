export type QuizStatus = "private" | "public";
export type QuizQuestionType = "radio" | "select" | "checkbox";

export type QuizProgressStatus = "not_started" | "in_progress" | "completed";

export interface QuizOptionInput {
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestionInput {
  label: string;
  type: QuizQuestionType;
  orderIndex?: number;
  options: QuizOptionInput[];
}

export interface UpdateQuizQuestionRequest {
  label?: string;
  type?: QuizQuestionType;
  orderIndex?: number;
  options?: QuizOptionInput[];
}

export interface QuizOptionPublic {
  id: number;
  label: string;
}

export interface QuizOptionFull extends QuizOptionPublic {
  isCorrect: boolean;
}

export interface QuizQuestionPublic {
  id: number;
  label: string;
  type: QuizQuestionType;
  orderIndex: number;
  options: QuizOptionPublic[];
}

export interface QuizQuestionFull extends QuizQuestionPublic {
  options: QuizOptionFull[];
}

export interface QuizSummary {
  id: number;
  type: "quiz";
  title: string;
  description: string | null;
  status: QuizStatus;
  creatorId: number;
  askAdmin: boolean;
  questionCount: number;
  position: number | null;
  createdAt: string;
  progress: QuizProgress | null;
}

export interface QuizPlayView {
  id: number;
  type: "quiz";
  title: string;
  description: string | null;
  status: QuizStatus;
  creatorId: number;
  questionCount: number;
  createdAt: string;
  questions: QuizQuestionPublic[];
}

export interface QuizDetail extends QuizPlayView {
  askAdmin: boolean;
  updatedAt: string | null;
  questions: QuizQuestionFull[];
}

export type StaticQuiz = Omit<QuizDetail, "askAdmin" | "updatedAt"> & {
  position: number;
};

export interface QuizProgress {
  quizId: number;
  studentId?: number;
  status: QuizProgressStatus;
  attemptCount: number;
  currentQuestionIndex: number;
  startedAt: string | null;
  completedAt: string | null;
  lastScore: number | null;
  bestScore: number | null;
}

export type ApiQuizProgress = QuizProgress & { userId?: number };

export interface CreateQuizRequest {
  title: string;
  description?: string;
  status?: QuizStatus;
  questions?: QuizQuestionInput[];
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  status?: QuizStatus;
  askAdmin?: boolean;
}

export interface SubmitQuizResponseRequest {
  questionId: number;
  optionIds: number[];
}

export interface QuizCorrectionQuestion extends QuizQuestionFull {
  selectedOptionIds: number[];
  isCorrect: boolean;
}

export interface QuizCorrection {
  quiz: {
    id: number;
    title: string;
    status: QuizStatus;
  };
  attempt: {
    number: number;
    completedAt: string | null;
    score: number;
    total: number;
  };
  questions: QuizCorrectionQuestion[];
}

export interface QuizTargetClass {
  quizId: number;
  classId: number;
  isActive: boolean;
}

export interface QuizListEnvelopeData {
  items: QuizSummary[];
}

export interface QuizPlayEnvelopeData {
  quiz: QuizPlayView;
}

export interface QuizDetailEnvelopeData {
  quiz: QuizDetail;
}

export interface QuizProgressEnvelopeData {
  progress: QuizProgress;
}

export interface QuizQuestionEnvelopeData {
  question: QuizQuestionFull;
}

export interface QuizTargetClassListEnvelopeData {
  items: Array<Pick<QuizTargetClass, "classId" | "isActive">>;
}

export interface QuizTargetClassEnvelopeData {
  targetClass: QuizTargetClass;
}
