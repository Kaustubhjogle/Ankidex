export type QualityScore = 0 | 1 | 2 | 3 | 4 | 5;

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  createdAt: number;
  dueAt: number;
  intervalDays: number;
  easeFactor: number;
  streak: number;
  reviews: number;
};

export type Deck = {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: number;
};
