import type {
  QuizQuestionFull,
  QuizQuestionInput,
  UpdateQuizQuestionRequest
} from "../Quiz.js";

export interface DraftProposition {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface QuestionDraft {
  questionId: number | null;
  label: string;
  propositions: DraftProposition[];
}

export interface QuizQuestionsSectionFeatures {
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface QuizQuestionsSectionActions {
  updateQuestion: (questionId: number, request: UpdateQuizQuestionRequest) => Promise<void>;
  addQuestion?: (input: QuizQuestionInput) => Promise<void>;
  deleteQuestion: (questionId: number) => Promise<void>;
}

export interface QuizQuestionsSectionConfig {
  quizId: number;
  questions: QuizQuestionFull[];
  isLoading: boolean;
  features: QuizQuestionsSectionFeatures;
  emptyState: {
    title: string;
    description: string;
  };
  actions: QuizQuestionsSectionActions;
  findQuestionById: (questionId: number) => QuizQuestionFull | null;
  onChanged: () => Promise<void>;
  onError?: (message: string) => void;
}

export interface QuizQuestionsSectionBindContext {
  root: HTMLElement;
  listen: (
    target: HTMLElement | Window | Document,
    type: keyof HTMLElementEventMap,
    listener: (event: Event) => void
  ) => void;
  onRender: () => void;
}
