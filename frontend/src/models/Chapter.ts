export interface Chapter {
  id: number;
  slug: string;
  title: string;
  statement: string;
  position: number;
  isActive: boolean;
}

export interface ChapterListEnvelopeData {
  items: Chapter[];
}
