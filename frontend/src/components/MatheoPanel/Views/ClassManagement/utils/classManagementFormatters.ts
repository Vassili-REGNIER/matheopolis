import type { StudentChapterProgressSummary } from "../../../../../models/ChapterProgress.js";
import type { Classroom } from "../../../../../models/Class.js";
import { formatDate } from "../../../../../utils/dom.js";

const CLASS_LEVELS = [
  { value: "grade_6", label: "6e" },
  { value: "grade_7", label: "5e" },
  { value: "grade_8", label: "4e" },
  { value: "grade_9", label: "3e" },
  { value: "grade_10", label: "Seconde" },
  { value: "grade_11", label: "Premiere" },
  { value: "grade_12", label: "Terminale" }
];

export function classLevelOptions(): Array<{ value: string; label: string }> {
  return [...CLASS_LEVELS];
}

export function formatClassLevel(level: Classroom["level"]): string {
  if (level === null || level === undefined || level === "") {
    return "Niveau non renseigne";
  }

  const match = CLASS_LEVELS.find((entry) => entry.value === level);
  return match?.label ?? String(level);
}

export function formatClassCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDate(value);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatStudentName(row: StudentChapterProgressSummary): string {
  if (row.user !== undefined) {
    return `${row.user.firstName} ${row.user.lastName}`.trim();
  }

  return `Eleve #${row.userId ?? "?"}`;
}

export function formatStudentUsername(row: StudentChapterProgressSummary): string {
  const username = row.user?.username?.trim();
  if (username !== undefined && username.length > 0) {
    return username;
  }

  return "Non renseigne";
}

export function formatLastActivity(value: string | null): string {
  if (value === null || value.trim() === "") {
    return "Aucune activite";
  }

  return formatDate(value);
}
