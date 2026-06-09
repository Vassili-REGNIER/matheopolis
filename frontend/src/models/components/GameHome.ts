export interface ChapterViewModel {
  id: number;
  title: string;
  subtitle: string;
  era: string;
  progress: number;
  progressLabel: string;
  enabled: boolean;
  status: string;
  route: string;
  kind: "chapter" | "quiz";
  visibility?: "public" | "private";
}

export type GameHomeContentFilter = "chapters" | "private_quizzes" | "public_quizzes";

export interface GameHomeTemplateState {
  isGuestMode: boolean;
  playerName: string;
  exploredChapters: number;
  chapterCount: number;
  totalProgress: number;
  searchQuery: string;
  activeContentFilters: ReadonlySet<GameHomeContentFilter>;
}

export interface GameHomeContentTemplateData {
  state: GameHomeTemplateState;
  chapters: ChapterViewModel[];
  privateQuizzes: ChapterViewModel[];
  publicQuizzes: ChapterViewModel[];
  showEmptyFilterState: boolean;
}

export interface GameHomeModalTemplateData {
  quizRestartTarget: { quizId: number; title: string } | null;
  quizRestartMessage: string;
  isProcessingQuizRestart: boolean;
}
