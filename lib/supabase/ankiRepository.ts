import type { SupabaseClient } from "@supabase/supabase-js";
import { Deck, Flashcard } from "@/components/ankiTypes";

type DeckRow = {
  id: string;
  title: string;
  created_at: string;
};

type CardRow = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  created_at: string;
};

type ReviewRow = {
  card_id: string;
  ease_factor: number;
  interval: number;
  next_review_at: string;
  streak: number;
  reviews: number;
};

function toMillis(ts: string | null | undefined, fallback: number) {
  if (!ts) return fallback;
  const value = new Date(ts).getTime();
  return Number.isNaN(value) ? fallback : value;
}

export async function fetchUserDecks(supabase: SupabaseClient, userId: string): Promise<Deck[]> {
  const { data: deckRows, error: deckError } = await supabase
    .from("decks")
    .select("id,title,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (deckError) {
    throw new Error(deckError.message);
  }

  const decks = (deckRows ?? []) as DeckRow[];
  if (decks.length === 0) return [];

  const deckIds = decks.map((deck) => deck.id);

  const { data: cardRows, error: cardError } = await supabase
    .from("cards")
    .select("id,deck_id,front,back,created_at")
    .in("deck_id", deckIds)
    .order("created_at", { ascending: false });

  if (cardError) {
    throw new Error(cardError.message);
  }

  const cards = (cardRows ?? []) as CardRow[];
  const cardIds = cards.map((card) => card.id);

  let reviewByCardId = new Map<string, ReviewRow>();

  if (cardIds.length > 0) {
    const { data: reviewRows, error: reviewError } = await supabase
      .from("card_reviews")
      .select("card_id,ease_factor,interval,next_review_at,streak,reviews")
      .eq("user_id", userId)
      .in("card_id", cardIds);

    if (reviewError) {
      throw new Error(reviewError.message);
    }

    reviewByCardId = new Map(
      ((reviewRows ?? []) as ReviewRow[]).map((review) => [review.card_id, review])
    );
  }

  const cardsByDeck = new Map<string, Flashcard[]>();

  cards.forEach((card) => {
    const createdAtMs = toMillis(card.created_at, Date.now());
    const review = reviewByCardId.get(card.id);

    const flashcard: Flashcard = {
      id: card.id,
      front: card.front,
      back: card.back,
      createdAt: createdAtMs,
      dueAt: toMillis(review?.next_review_at, createdAtMs),
      intervalDays: review?.interval ?? 0,
      easeFactor: review?.ease_factor ?? 2.2,
      streak: review?.streak ?? 0,
      reviews: review?.reviews ?? 0,
    };

    const existing = cardsByDeck.get(card.deck_id) ?? [];
    cardsByDeck.set(card.deck_id, [...existing, flashcard]);
  });

  return decks.map((deck) => ({
    id: deck.id,
    name: deck.title,
    createdAt: toMillis(deck.created_at, Date.now()),
    cards: cardsByDeck.get(deck.id) ?? [],
  }));
}

export async function createDeckRecord(supabase: SupabaseClient, userId: string, title: string): Promise<Deck> {
  const { data, error } = await supabase
    .from("decks")
    .insert({ user_id: userId, title })
    .select("id,title,created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create deck.");
  }

  const row = data as DeckRow;

  return {
    id: row.id,
    name: row.title,
    createdAt: toMillis(row.created_at, Date.now()),
    cards: [],
  };
}

export async function createCardRecord(
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  front: string,
  back: string
): Promise<Flashcard> {
  const { data: cardData, error: cardError } = await supabase
    .from("cards")
    .insert({ deck_id: deckId, front, back })
    .select("id,deck_id,front,back,created_at")
    .single();

  if (cardError || !cardData) {
    throw new Error(cardError?.message ?? "Could not create card.");
  }

  const card = cardData as CardRow;
  const createdAtMs = toMillis(card.created_at, Date.now());

  const initialReview = {
    card_id: card.id,
    user_id: userId,
    ease_factor: 2.2,
    interval: 0,
    next_review_at: new Date(createdAtMs).toISOString(),
    streak: 0,
    reviews: 0,
  };

  const { error: reviewError } = await supabase.from("card_reviews").insert(initialReview);
  if (reviewError) {
    throw new Error(reviewError.message);
  }

  return {
    id: card.id,
    front: card.front,
    back: card.back,
    createdAt: createdAtMs,
    dueAt: createdAtMs,
    intervalDays: 0,
    easeFactor: 2.2,
    streak: 0,
    reviews: 0,
  };
}

export async function upsertCardReviewRecord(
  supabase: SupabaseClient,
  userId: string,
  card: Flashcard
): Promise<void> {
  const { error } = await supabase.from("card_reviews").upsert(
    {
      card_id: card.id,
      user_id: userId,
      ease_factor: card.easeFactor,
      interval: card.intervalDays,
      next_review_at: new Date(card.dueAt).toISOString(),
      streak: card.streak,
      reviews: card.reviews,
    },
    { onConflict: "card_id,user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetDeckReviews(
  supabase: SupabaseClient,
  userId: string,
  cards: Flashcard[],
  now: number
): Promise<void> {
  if (cards.length === 0) return;

  const payload = cards.map((card) => ({
    card_id: card.id,
    user_id: userId,
    ease_factor: 2.2,
    interval: 0,
    next_review_at: new Date(now).toISOString(),
    streak: 0,
    reviews: 0,
  }));

  const { error } = await supabase.from("card_reviews").upsert(payload, {
    onConflict: "card_id,user_id",
  });

  if (error) {
    throw new Error(error.message);
  }
}
