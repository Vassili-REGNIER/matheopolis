import type {
  CreateQuizRequest,
  UpdateQuizRequest
} from "../../../../../models/Quiz.js";

export interface QuestionnaireFormValues {
  title: string;
  description: string;
}

export type QuestionnaireFormResult =
  | { ok: true; values: QuestionnaireFormValues }
  | { ok: false; message: string };

export function readQuestionnaireForm(form: HTMLFormElement): QuestionnaireFormResult {
  const data = new FormData(form);
  const title = String(data.get("title") ?? "").trim();
  const description = String(data.get("description") ?? "").trim();

  if (title.length === 0) {
    return { ok: false, message: "Le nom est obligatoire." };
  }

  return {
    ok: true,
    values: {
      title,
      description
    }
  };
}

export function buildCreateQuestionnaireRequest(values: QuestionnaireFormValues): CreateQuizRequest {
  return {
    title: values.title,
    description: values.description.length > 0 ? values.description : undefined,
    status: "private"
  };
}

export function buildUpdateQuestionnaireRequest(values: QuestionnaireFormValues): UpdateQuizRequest {
  return {
    title: values.title,
    description: values.description.length > 0 ? values.description : ""
  };
}
