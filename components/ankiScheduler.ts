import { Flashcard, QualityScore } from "@/components/ankiTypes";

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function formatNextReview(ts: number, now: number) {
  const diff = ts - now;
  if (diff <= 0) return "now";

  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function applyRecall(card: Flashcard, q: QualityScore, now: number): Flashcard {
  const efOld = card.easeFactor;
  const efNew = Math.max(
    1.3,
    efOld + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  if (q < 3) {
    const resetInterval = 1;
    return {
      ...card,
      dueAt: now + resetInterval * 24 * 60 * 60 * 1000,
      intervalDays: resetInterval,
      easeFactor: efNew,
      streak: 0,
      reviews: card.reviews + 1,
    };
  }

  const nextStreak = card.streak + 1;
  let nextInterval = 1;

  if (nextStreak === 1) {
    nextInterval = 1;
  } else if (nextStreak === 2) {
    nextInterval = 6;
  } else {
    nextInterval = Math.ceil(card.intervalDays * efOld);
  }

  return {
    ...card,
    dueAt: now + nextInterval * 24 * 60 * 60 * 1000,
    intervalDays: nextInterval,
    easeFactor: efNew,
    streak: nextStreak,
    reviews: card.reviews + 1,
  };
}

export function resetCardProgress(card: Flashcard, now: number): Flashcard {
  return {
    ...card,
    dueAt: now,
    intervalDays: 0,
    easeFactor: 2.2,
    streak: 0,
    reviews: 0,
  };
}
