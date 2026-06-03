import type { MatheopolisQuizQuestion } from "../models/Quiz.js";
import { isRecord, readNumber, readString } from "../utils/dom.js";
import type { ApiClient } from "./ApiClient.js";

export class ContentService {
  public constructor(private readonly api: ApiClient) {}

  public async loadMatheopolisQuiz(): Promise<MatheopolisQuizQuestion[]> {
    const payload = await this.api.getStaticJson<unknown>("./public/content/quizzes/matheopolis.json");
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map((item) => this.toQuizQuestion(item))
      .filter((item): item is MatheopolisQuizQuestion => item !== null);
  }

  private toQuizQuestion(value: unknown): MatheopolisQuizQuestion | null {
    if (!isRecord(value) || !Array.isArray(value.options)) {
      return null;
    }

    const options = value.options
      .map((option) => {
        if (!isRecord(option)) {
          return null;
        }
        return {
          id: readString(option.id),
          text: readString(option.text)
        };
      })
      .filter((option): option is { id: string; text: string } => option !== null && option.id.length > 0);

    if (options.length === 0) {
      return null;
    }

    return {
      id: readNumber(value.id),
      question: readString(value.question),
      options,
      correctAnswer: readString(value.correctAnswer)
    };
  }
}
