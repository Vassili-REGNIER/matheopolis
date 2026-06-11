export interface ChapterViewModel {
  id: number;
  title: string;
  subtitle: string;
  era: string;
  progress: number;
  progressLabel: string;
  status: string;
  route: string;
  kind: "chapter" | "quiz";
  visibility?: "public" | "private";
}

export type GameHomeContentFilter = "chapters" | "private_quizzes" | "public_quizzes";

export interface GameHomeTemplateState {
  isGuestMode: boolean;
  playerName: string;
  exploredChaptersLabel: string;
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
