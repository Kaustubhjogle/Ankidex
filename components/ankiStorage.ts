import { Deck } from "@/components/ankiTypes";

export const STORAGE_KEY = "anki_vibe_state_v1";

export function loadDecksFromStorage() {
  if (typeof window === "undefined") return [] as Deck[];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { decks?: Deck[] };
    return parsed.decks ?? [];
  } catch {
    return [];
  }
}

export function loadActiveDeckIdFromStorage() {
  if (typeof window === "undefined") return null as string | null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { decks?: Deck[]; activeDeckId?: string | null };
    if (!parsed.decks?.length) return null;
    return parsed.activeDeckId ?? parsed.decks[0].id;
  } catch {
    return null;
  }
}

export function saveStateToStorage(decks: Deck[], activeDeckId: string | null) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ decks, activeDeckId }));
}
