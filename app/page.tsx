"use client";

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Snippet,
  Textarea,
} from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type RecallLevel = "not_recognizable" | "recognizable" | "easy";

type Flashcard = {
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

type Deck = {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: number;
};

const STORAGE_KEY = "anki_vibe_state_v1";

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function formatNextReview(ts: number, now: number) {
  const diff = ts - now;
  if (diff <= 0) return "now";

  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

function applyRecall(card: Flashcard, recall: RecallLevel, now: number): Flashcard {
  if (recall === "not_recognizable") {
    return {
      ...card,
      dueAt: now + 10 * 60 * 1000,
      intervalDays: 0,
      easeFactor: Math.max(1.3, card.easeFactor - 0.2),
      streak: 0,
      reviews: card.reviews + 1,
    };
  }

  if (recall === "recognizable") {
    const nextInterval =
      card.streak === 0
        ? 1
        : Math.max(1, Math.round(card.intervalDays * Math.max(1.4, card.easeFactor)));

    return {
      ...card,
      dueAt: now + nextInterval * 24 * 60 * 60 * 1000,
      intervalDays: nextInterval,
      easeFactor: Math.min(2.8, card.easeFactor + 0.05),
      streak: card.streak + 1,
      reviews: card.reviews + 1,
    };
  }

  const easyInterval =
    card.streak === 0
      ? 3
      : Math.max(2, Math.round(card.intervalDays * Math.max(1.8, card.easeFactor + 0.3)));

  return {
    ...card,
    dueAt: now + easyInterval * 24 * 60 * 60 * 1000,
    intervalDays: easyInterval,
    easeFactor: Math.min(3.0, card.easeFactor + 0.12),
    streak: card.streak + 1,
    reviews: card.reviews + 1,
  };
}

function resetCardProgress(card: Flashcard, now: number): Flashcard {
  return {
    ...card,
    dueAt: now,
    intervalDays: 0,
    easeFactor: 2.2,
    streak: 0,
    reviews: 0,
  };
}

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { decks?: Deck[] };
      return parsed.decks ?? [];
    } catch {
      return [];
    }
  });
  const [activeDeckId, setActiveDeckId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { decks?: Deck[]; activeDeckId?: string | null };
      if (!parsed.decks?.length) return null;
      return parsed.activeDeckId ?? parsed.decks[0].id;
    } catch {
      return null;
    }
  });

  const [newDeckName, setNewDeckName] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isSidebarPinnedOpen, setIsSidebarPinnedOpen] = useState(false);
  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ decks, activeDeckId }));
  }, [decks, activeDeckId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId) ?? null,
    [decks, activeDeckId]
  );

  const dueCards = useMemo(() => {
    if (!activeDeck) return [];
    return activeDeck.cards.filter((card) => card.dueAt <= nowTs);
  }, [activeDeck, nowTs]);

  const reviewCard = useMemo(() => {
    if (!activeDeck || dueCards.length === 0) return null;
    const selectedId = reviewCardId && dueCards.some((card) => card.id === reviewCardId)
      ? reviewCardId
      : dueCards[0]?.id;

    return dueCards.find((card) => card.id === selectedId) ?? null;
  }, [activeDeck, dueCards, reviewCardId]);

  const dueCount = dueCards.length;
  const totalCards = activeDeck?.cards.length ?? 0;
  const progressValue = Math.round(((totalCards - dueCount) / Math.max(totalCards, 1)) * 100);

  const sortedCards = useMemo(() => {
    if (!activeDeck) return [];
    return [...activeDeck.cards].sort((a, b) => a.dueAt - b.dueAt);
  }, [activeDeck]);

  function createDeck() {
    const name = newDeckName.trim();
    if (!name) return;

    const deck: Deck = {
      id: makeId(),
      name,
      createdAt: Date.now(),
      cards: [],
    };

    setDecks((prev) => [deck, ...prev]);
    setActiveDeckId(deck.id);
    setNewDeckName("");
    setReviewCardId(null);
    setShowBack(false);
    setIsDeckModalOpen(false);
  }

  function addCard() {
    if (!activeDeckId) return;

    const front = newFront.trim();
    const back = newBack.trim();
    if (!front || !back) return;

    const card: Flashcard = {
      id: makeId(),
      front,
      back,
      createdAt: Date.now(),
      dueAt: Date.now(),
      intervalDays: 0,
      easeFactor: 2.2,
      streak: 0,
      reviews: 0,
    };

    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === activeDeckId
          ? {
              ...deck,
              cards: [card, ...deck.cards],
            }
          : deck
      )
    );

    setNewFront("");
    setNewBack("");
    setIsAddModalOpen(false);
    setReviewCardId(card.id);
    setShowBack(false);
    setNowTs(Date.now());
  }

  function rateCurrentCard(recall: RecallLevel) {
    if (!activeDeckId || !reviewCard) return;

    const now = Date.now();
    const nextCard = applyRecall(reviewCard, recall, now);

    setDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== activeDeckId) return deck;

        return {
          ...deck,
          cards: deck.cards.map((card) => (card.id === reviewCard.id ? nextCard : card)),
        };
      })
    );

    setShowBack(false);
    setReviewCardId(null);
    setNowTs(now);
  }

  function resetProgress() {
    if (!activeDeckId) return;

    const now = Date.now();
    setDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== activeDeckId) return deck;
        return {
          ...deck,
          cards: deck.cards.map((card) => resetCardProgress(card, now)),
        };
      })
    );

    setReviewCardId(null);
    setShowBack(false);
    setNowTs(now);
  }

  function switchDeck(deckId: string) {
    setActiveDeckId(deckId);
    setReviewCardId(null);
    setShowBack(false);
    setIsSidebarMinimized(true);
    setIsSidebarPinnedOpen(false);
  }

  const isSidebarExpanded = !isSidebarMinimized || isSidebarPinnedOpen;
  const sidebarContentClass = isSidebarExpanded
    ? "max-h-24 opacity-100 translate-x-0"
    : "max-h-0 opacity-0 -translate-x-1 pointer-events-none";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.25),_transparent_42%),linear-gradient(145deg,#f8fafc_0%,#f8fafc_45%,#fff7ed_100%)] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Smart Repetition</p>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-zinc-900 sm:text-3xl">
              Anki Deck Lab
            </h1>
          </div>
          <Button
            color="primary"
            variant="shadow"
            className="font-semibold"
            onPress={() => setIsAddModalOpen(true)}
            isDisabled={!activeDeck}
          >
            Add Flashcard
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <Card
            className={`border border-white/70 bg-white/85 shadow-xl shadow-sky-100/60 backdrop-blur md:h-[calc(100vh-120px)] md:sticky md:top-4 transition-[width] duration-300 ease-out ${
              isSidebarExpanded ? "md:w-[260px]" : "md:w-[84px]"
            }`}
            onMouseEnter={() => {
              if (isSidebarMinimized) setIsSidebarPinnedOpen(true);
            }}
            onMouseLeave={() => {
              if (isSidebarMinimized) setIsSidebarPinnedOpen(false);
            }}
            onClick={() => {
              if (isSidebarMinimized && !isSidebarPinnedOpen) {
                setIsSidebarPinnedOpen(true);
              }
            }}
          >
            <CardHeader className="pb-2">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-zinc-900">
                    {isSidebarExpanded ? "Decks" : "📚"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div
                      className={`overflow-hidden transition-all duration-200 ease-out ${sidebarContentClass}`}
                    >
                      <Badge color="primary" variant="flat">
                        {decks.length}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      isIconOnly
                      onPress={() => {
                        setIsSidebarMinimized((prev) => !prev);
                        setIsSidebarPinnedOpen(false);
                      }}
                    >
                      {isSidebarExpanded ? "−" : "+"}
                    </Button>
                  </div>
                </div>
                <div
                  className={`overflow-hidden transition-all duration-200 ease-out ${sidebarContentClass}`}
                >
                  <Button
                    color="secondary"
                    className="font-semibold w-full"
                    onPress={() => setIsDeckModalOpen(true)}
                  >
                    Add Deck
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-2">
              {decks.length === 0 ? (
                <p className="text-sm text-zinc-500">Create a deck to get started.</p>
              ) : (
                <div className="space-y-2 overflow-x-auto md:overflow-y-auto">
                  {decks.map((deck) => {
                    const due = deck.cards.filter((card) => card.dueAt <= nowTs).length;
                    const selected = deck.id === activeDeckId;

                    return (
                      <button
                        key={deck.id}
                        onClick={() => switchDeck(deck.id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-blue-300 bg-blue-50/80 shadow-sm"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="relative min-h-10">
                          <div
                            className={`transition-all duration-200 ease-out ${
                              isSidebarExpanded
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-1 pointer-events-none"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-zinc-900 truncate">{deck.name}</p>
                              <Chip size="sm" color={due > 0 ? "warning" : "success"} variant="flat">
                                {due}
                              </Chip>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">{deck.cards.length} Cards</p>
                          </div>
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
                              isSidebarExpanded
                                ? "opacity-0 scale-95 pointer-events-none"
                                : "opacity-100 scale-100"
                            }`}
                          >
                            <Chip size="sm" color={due > 0 ? "warning" : "success"} variant="flat">
                              {due}
                            </Chip>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="space-y-4 pb-6">
            <Card className="border border-white/70 bg-white/90 shadow-xl shadow-indigo-100/60 backdrop-blur">
              <CardHeader className="flex-col items-start gap-3">
                <div className="flex w-full items-center justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-zinc-900 sm:text-xl">
                    {activeDeck ? `${activeDeck.name} Review` : "Review"}
                  </h2>
                  <Chip color={dueCount > 0 ? "warning" : "success"} variant="flat">
                    {dueCount} Due
                  </Chip>
                </div>
                <Progress value={progressValue} color={progressValue > 80 ? "success" : "primary"} />
              </CardHeader>
              <CardBody>
                {!activeDeck ? (
                  <p className="text-sm text-zinc-500">Pick a deck from the sidebar to start.</p>
                ) : !reviewCard ? (
                  <div className="space-y-3">
                    <p className="text-zinc-800 font-medium">
                      {totalCards === 0 ? "No cards yet in this deck." : "You covered all cards for now."}
                    </p>
                    {totalCards > 0 ? (
                      <Button color="primary" variant="flat" onPress={resetProgress} className="font-semibold">
                        Reset Progress
                      </Button>
                    ) : (
                      <Button color="primary" variant="flat" onPress={() => setIsAddModalOpen(true)}>
                        Add Your First Flashcard
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${reviewCard.id}-${showBack ? "back" : "front"}`}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-5 shadow-inner"
                      >
                        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          {showBack ? "Back" : "Front"}
                        </p>
                        <p className="text-base leading-relaxed text-zinc-900 sm:text-lg">
                          {showBack ? reviewCard.back : reviewCard.front}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    {!showBack ? (
                      <Button color="primary" variant="shadow" onPress={() => setShowBack(true)}>
                        Show Answer
                      </Button>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Button color="danger" variant="flat" onPress={() => rateCurrentCard("not_recognizable")}>
                          Not Recognizable
                        </Button>
                        <Button color="warning" variant="flat" onPress={() => rateCurrentCard("recognizable")}>
                          Recognizable
                        </Button>
                        <Button color="success" variant="flat" onPress={() => rateCurrentCard("easy")}>
                          Easy
                        </Button>
                      </div>
                    )}

                    <Snippet hideSymbol size="sm" className="bg-zinc-100 text-zinc-600">
                      Recognizable answer returns in {formatNextReview(applyRecall(reviewCard, "recognizable", nowTs).dueAt, nowTs)}
                    </Snippet>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="border border-white/70 bg-white/90 shadow-xl shadow-amber-100/70 backdrop-blur">
              <CardHeader>
                <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-zinc-900">
                  Flashcards
                </h3>
              </CardHeader>
              <CardBody>
                {!activeDeck ? (
                  <p className="text-sm text-zinc-500">Select a deck to see flashcards.</p>
                ) : sortedCards.length === 0 ? (
                  <p className="text-sm text-zinc-500">No flashcards yet in this deck.</p>
                ) : (
                  <div className="space-y-3">
                    {sortedCards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-2xl border border-zinc-200/90 bg-white px-4 py-3 shadow-sm"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Front</p>
                        <p className="mt-1 text-sm font-medium text-zinc-900">{card.front}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">Back</p>
                        <p className="mt-1 text-sm text-zinc-700">{card.back}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Chip size="sm" color={card.dueAt <= nowTs ? "warning" : "default"} variant="flat">
                            {card.dueAt <= nowTs ? "Due Now" : `In ${formatNextReview(card.dueAt, nowTs)}`}
                          </Chip>
                          <p className="text-xs text-zinc-500">Reviews: {card.reviews}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen} placement="bottom-center" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add Flashcard</ModalHeader>
              <ModalBody className="space-y-2">
                <Textarea
                  value={newFront}
                  onValueChange={setNewFront}
                  label="Front"
                  labelPlacement="outside"
                  minRows={2}
                  placeholder="Type your question"
                  variant="bordered"
                />
                <Textarea
                  value={newBack}
                  onValueChange={setNewBack}
                  label="Back"
                  labelPlacement="outside"
                  minRows={2}
                  placeholder="Type your answer"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={addCard}>
                  Save Card
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeckModalOpen} onOpenChange={setIsDeckModalOpen} placement="bottom-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">New Deck</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  value={newDeckName}
                  onValueChange={setNewDeckName}
                  variant="bordered"
                  placeholder="Deck name"
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={createDeck}>
                  Create Deck
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
