import { isRecord, readNumber, readString } from "../utils/dom.js";
export class ContentService {
    api;
    constructor(api) {
        this.api = api;
    }
    async loadMatheopolisQuiz() {
        const payload = await this.api.getStaticJson("./public/content/quizzes/matheopolis.json");
        if (!Array.isArray(payload)) {
            return [];
        }
        return payload
            .map((item) => this.toQuizQuestion(item))
            .filter((item) => item !== null);
    }
    toQuizQuestion(value) {
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
            .filter((option) => option !== null && option.id.length > 0);
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
