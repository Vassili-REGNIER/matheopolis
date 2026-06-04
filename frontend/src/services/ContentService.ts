import type { QuizQuestionFull, QuizQuestionType, QuizStatus, StaticQuiz } from "../models/Quiz.js";
import { isRecord, readBoolean, readNumber, readString } from "../utils/dom.js";
import type { ApiClient } from "./ApiClient.js";

export class ContentService {
  private static readonly matheopolisQuizAnswersKey = "matheopolis.quiz.matheopolis.answers";

  public constructor(private readonly api: ApiClient) {}

  public async loadMatheopolisQuiz(): Promise<StaticQuiz | null> {
    const payload = await this.api.getStaticJson<unknown>("./public/content/quizzes/matheopolis.json");
    if (!isRecord(payload) || !Array.isArray(payload.questions)) {
      return null;
    }

    const questions = payload.questions
      .map((item) => this.toQuizQuestion(item))
      .filter((item): item is QuizQuestionFull => item !== null);

    return {
      id: readNumber(payload.id, 999),
      type: "quiz",
      title: readString(payload.title, "L'Histoire de Laurence"),
      description: readString(payload.description, "Testez vos connaissances sur le livre."),
      status: this.toQuizStatus(payload.status),
      creatorId: readNumber(payload.creatorId),
      questionCount: readNumber(payload.questionCount, questions.length),
      position: readNumber(payload.position),
      createdAt: readString(payload.createdAt),
      questions
    };
  }

  public loadMatheopolisQuizAnswers(): Map<number, Set<number>> {
    const raw = window.localStorage.getItem(ContentService.matheopolisQuizAnswersKey);
    if (raw === null) {
      return new Map<number, Set<number>>();
    }

    try {
      const payload = JSON.parse(raw) as unknown;
      if (!isRecord(payload)) {
        return new Map<number, Set<number>>();
      }

      const answers = new Map<number, Set<number>>();
      Object.entries(payload).forEach(([questionId, optionIds]) => {
        if (!Array.isArray(optionIds)) {
          return;
        }

        const parsedQuestionId = Number.parseInt(questionId, 10);
        const parsedOptionIds = optionIds.filter((optionId): optionId is number => (
          typeof optionId === "number" && Number.isFinite(optionId)
        ));

        if (!Number.isNaN(parsedQuestionId) && parsedOptionIds.length > 0) {
          answers.set(parsedQuestionId, new Set(parsedOptionIds));
        }
      });

      return answers;
    } catch {
      window.localStorage.removeItem(ContentService.matheopolisQuizAnswersKey);
      return new Map<number, Set<number>>();
    }
  }

  public saveMatheopolisQuizAnswer(questionId: number, optionIds: Set<number>): void {
    const answers = this.loadMatheopolisQuizAnswers();
    if (optionIds.size === 0) {
      answers.delete(questionId);
    } else {
      answers.set(questionId, optionIds);
    }

    const payload: Record<string, number[]> = {};
    answers.forEach((selectedOptionIds, selectedQuestionId) => {
      payload[String(selectedQuestionId)] = Array.from(selectedOptionIds);
    });

    window.localStorage.setItem(ContentService.matheopolisQuizAnswersKey, JSON.stringify(payload));
  }

  public matheopolisQuizProgress(totalQuestions: number): { answeredQuestions: number; totalQuestions: number; percent: number } {
    const answeredQuestions = Math.min(this.loadMatheopolisQuizAnswers().size, totalQuestions);
    const percent = totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100);

    return {
      answeredQuestions,
      totalQuestions,
      percent
    };
  }

  private toQuizQuestion(value: unknown): QuizQuestionFull | null {
    if (!isRecord(value) || !Array.isArray(value.options)) {
      return null;
    }

    const options = value.options
      .map((option) => {
        if (!isRecord(option)) {
          return null;
        }
        return {
          id: readNumber(option.id),
          label: readString(option.label),
          isCorrect: readBoolean(option.isCorrect)
        };
      })
      .filter((option): option is { id: number; label: string; isCorrect: boolean } => (
        option !== null && option.id > 0 && option.label.length > 0
      ));

    if (options.length === 0) {
      return null;
    }

    return {
      id: readNumber(value.id),
      label: readString(value.label),
      type: this.toQuestionType(value.type),
      orderIndex: readNumber(value.orderIndex),
      options
    };
  }

  private toQuizStatus(value: unknown): QuizStatus {
    return value === "private" ? "private" : "public";
  }

  private toQuestionType(value: unknown): QuizQuestionType {
    if (value === "checkbox" || value === "select") {
      return value;
    }

    return "radio";
  }
}
