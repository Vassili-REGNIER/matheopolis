import { ApiError, unwrapEnvelope, type ApiEnvelope } from "../models/ApiEnvelopes.js";
import type {
  QuizCorrection,
  QuizCorrectionQuestion,
  QuizListEnvelopeData,
  QuizPlayEnvelopeData,
  QuizPlayView,
  QuizProgress,
  QuizQuestionFull,
  QuizSummary,
  SubmitQuizResponseRequest
} from "../models/Quiz.js";
import type { ApiClient } from "./ApiClient.js";

interface StoredQuizAttempt {
  quizId: number;
  studentId: number;
  status: "in_progress" | "completed";
  attemptCount: number;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt: string | null;
  lastScore: number | null;
  bestScore: number | null;
  answers: Record<string, number[]>;
  completedAnswers: Record<string, number[]> | null;
}

export class QuizService {
  private static readonly storagePrefix = "matheopolis.mockApi.quiz.";
  private static readonly mockRoot = "./public/mocks/api/quizzes";

  public constructor(private readonly api: ApiClient) {}

  public async listQuizzes(): Promise<QuizSummary[]> {
    const envelope = await this.api.getStaticJson<ApiEnvelope<QuizListEnvelopeData>>(`${QuizService.mockRoot}/list.json`);

    return unwrapEnvelope(envelope).items.map((quiz) => {
      const stored = this.readStoredAttempt(quiz.id);

      return {
        ...quiz,
        progress: stored === null ? null : this.progressFromStored(stored)
      };
    });
  }

  public async getQuiz(quizId: number): Promise<QuizPlayView> {
    const envelope = await this.api.getStaticJson<ApiEnvelope<QuizPlayEnvelopeData>>(`${QuizService.mockRoot}/${quizId}.json`);
    return unwrapEnvelope(envelope).quiz;
  }

  public async getProgress(quizId: number): Promise<QuizProgress> {
    const stored = this.readStoredAttempt(quizId);
    if (stored !== null) {
      return this.progressFromStored(stored);
    }

    const envelope = await this.api.getStaticJson<ApiEnvelope<{ progress: QuizProgress }>>(`${QuizService.mockRoot}/${quizId}-progress.json`);
    return unwrapEnvelope(envelope).progress;
  }

  public async startAttempt(quizId: number): Promise<QuizProgress> {
    const stored = this.startStoredAttempt(quizId);
    return this.progressFromStored(stored);
  }

  public async submitResponse(quizId: number, request: SubmitQuizResponseRequest): Promise<QuizProgress> {
    const quiz = await this.getQuiz(quizId);
    const question = quiz.questions.find((item) => item.id === request.questionId);
    if (question === undefined) {
      throw new ApiError(422, {
        code: "VALIDATION_ERROR",
        message: "Question does not belong to this quiz."
      });
    }

    let stored = this.readStoredAttempt(quizId);
    if (stored === null || stored.status === "completed") {
      stored = this.startStoredAttempt(quizId);
    }

    const expectedQuestion = quiz.questions[stored.currentQuestionIndex];
    if (expectedQuestion?.id !== request.questionId) {
      throw new ApiError(422, {
        code: "VALIDATION_ERROR",
        message: "Questions must be answered in order."
      });
    }

    this.validateOptionSelection(question, request.optionIds);

    const selected = Array.from(new Set(request.optionIds));
    stored.answers[String(request.questionId)] = selected;
    stored.currentQuestionIndex += 1;

    if (stored.currentQuestionIndex >= quiz.questions.length) {
      const correction = await this.loadCorrectionBase(quizId);
      const score = this.scoreAnswers(correction.questions, stored.answers);
      stored.status = "completed";
      stored.currentQuestionIndex = quiz.questions.length;
      stored.completedAt = new Date().toISOString();
      stored.lastScore = score;
      stored.bestScore = stored.bestScore === null ? score : Math.max(stored.bestScore, score);
      stored.completedAnswers = { ...stored.answers };
    }

    this.writeStoredAttempt(stored);
    return this.progressFromStored(stored);
  }

  public async getCorrection(quizId: number, attempt?: number): Promise<QuizCorrection> {
    const stored = this.readStoredAttempt(quizId);
    if (stored === null || stored.status !== "completed") {
      throw new ApiError(409, {
        code: "QUIZ_ATTEMPT_NOT_COMPLETED",
        message: "No completed attempt available."
      });
    }

    if (attempt !== undefined && attempt !== stored.attemptCount) {
      throw new ApiError(404, {
        code: "NOT_FOUND",
        message: "Attempt not found."
      });
    }

    const correction = await this.loadCorrectionBase(quizId);
    const answers = stored.completedAnswers ?? stored.answers;
    const questions = correction.questions.map((question) => this.correctedQuestion(question, answers));
    const score = questions.reduce((total, question) => total + (question.isCorrect ? 1 : 0), 0);

    return {
      quiz: correction.quiz,
      attempt: {
        number: stored.attemptCount,
        completedAt: stored.completedAt,
        score,
        total: correction.attempt.total
      },
      questions
    };
  }

  private async loadCorrectionBase(quizId: number): Promise<QuizCorrection> {
    const envelope = await this.api.getStaticJson<ApiEnvelope<QuizCorrection>>(`${QuizService.mockRoot}/${quizId}-correction.json`);
    return unwrapEnvelope(envelope);
  }

  private startStoredAttempt(quizId: number): StoredQuizAttempt {
    const existing = this.readStoredAttempt(quizId);
    const now = new Date().toISOString();
    const stored: StoredQuizAttempt = {
      quizId,
      studentId: existing?.studentId ?? 0,
      status: "in_progress",
      attemptCount: (existing?.attemptCount ?? 0) + 1,
      currentQuestionIndex: 0,
      startedAt: now,
      completedAt: null,
      lastScore: existing?.lastScore ?? null,
      bestScore: existing?.bestScore ?? null,
      answers: {},
      completedAnswers: existing?.completedAnswers ?? null
    };
    this.writeStoredAttempt(stored);

    return stored;
  }

  private progressFromStored(stored: StoredQuizAttempt): QuizProgress {
    return {
      quizId: stored.quizId,
      studentId: stored.studentId,
      status: stored.status,
      attemptCount: stored.attemptCount,
      currentQuestionIndex: stored.currentQuestionIndex,
      startedAt: stored.startedAt,
      completedAt: stored.completedAt,
      lastScore: stored.lastScore,
      bestScore: stored.bestScore
    };
  }

  private correctedQuestion(question: QuizCorrectionQuestion, answers: Record<string, number[]>): QuizCorrectionQuestion {
    const selectedOptionIds = answers[String(question.id)] ?? [];

    return {
      ...question,
      selectedOptionIds,
      isCorrect: this.isQuestionCorrect(question, selectedOptionIds)
    };
  }

  private scoreAnswers(questions: QuizQuestionFull[], answers: Record<string, number[]>): number {
    return questions.reduce((total, question) => {
      const selectedOptionIds = answers[String(question.id)] ?? [];
      return total + (this.isQuestionCorrect(question, selectedOptionIds) ? 1 : 0);
    }, 0);
  }

  private isQuestionCorrect(question: QuizQuestionFull, selectedOptionIds: number[]): boolean {
    const correct = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort((left, right) => left - right);
    const selected = [...selectedOptionIds].sort((left, right) => left - right);

    return correct.length === selected.length && correct.every((optionId, index) => optionId === selected[index]);
  }

  private validateOptionSelection(question: QuizPlayView["questions"][number], optionIds: number[]): void {
    const validOptionIds = new Set(question.options.map((option) => option.id));
    const allOptionsBelong = optionIds.every((optionId) => validOptionIds.has(optionId));
    if (!allOptionsBelong) {
      throw new ApiError(422, {
        code: "VALIDATION_ERROR",
        message: "Option does not belong to this question."
      });
    }

    if ((question.type === "radio" || question.type === "select") && optionIds.length !== 1) {
      throw new ApiError(422, {
        code: "VALIDATION_ERROR",
        message: "Exactly one option must be selected."
      });
    }
  }

  private readStoredAttempt(quizId: number): StoredQuizAttempt | null {
    const raw = window.localStorage.getItem(this.storageKey(quizId));
    if (raw === null) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredQuizAttempt>;
      if (
        typeof parsed.quizId !== "number"
        || (parsed.status !== "in_progress" && parsed.status !== "completed")
        || typeof parsed.attemptCount !== "number"
        || typeof parsed.currentQuestionIndex !== "number"
        || typeof parsed.startedAt !== "string"
      ) {
        return null;
      }

      return {
        quizId: parsed.quizId,
        studentId: typeof parsed.studentId === "number" ? parsed.studentId : 0,
        status: parsed.status,
        attemptCount: parsed.attemptCount,
        currentQuestionIndex: parsed.currentQuestionIndex,
        startedAt: parsed.startedAt,
        completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : null,
        lastScore: typeof parsed.lastScore === "number" ? parsed.lastScore : null,
        bestScore: typeof parsed.bestScore === "number" ? parsed.bestScore : null,
        answers: this.readAnswerRecord(parsed.answers),
        completedAnswers: parsed.completedAnswers === null || parsed.completedAnswers === undefined
          ? null
          : this.readAnswerRecord(parsed.completedAnswers)
      };
    } catch {
      window.localStorage.removeItem(this.storageKey(quizId));
      return null;
    }
  }

  private readAnswerRecord(value: unknown): Record<string, number[]> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {};
    }

    const answers: Record<string, number[]> = {};
    Object.entries(value).forEach(([questionId, optionIds]) => {
      if (!Array.isArray(optionIds)) {
        return;
      }

      answers[questionId] = optionIds.filter((optionId): optionId is number => (
        typeof optionId === "number" && Number.isFinite(optionId)
      ));
    });

    return answers;
  }

  private writeStoredAttempt(stored: StoredQuizAttempt): void {
    window.localStorage.setItem(this.storageKey(stored.quizId), JSON.stringify(stored));
  }

  private storageKey(quizId: number): string {
    return `${QuizService.storagePrefix}${quizId}`;
  }
}
