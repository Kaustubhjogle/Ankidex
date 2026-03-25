"use client";

import { Button } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import AnkiAddDeckModal from "@/components/AnkiAddDeckModal";
import AnkiAddFlashcardModal from "@/components/AnkiAddFlashcardModal";
import AnkiAllFlashcardsModal from "@/components/AnkiAllFlashcardsModal";
import AnkiHeader from "@/components/AnkiHeader";
import AnkiReviewPanel from "@/components/AnkiReviewPanel";
import AnkiSidebar from "@/components/AnkiSidebar";
import { applyRecall, makeId, resetCardProgress } from "@/components/ankiScheduler";
import { loadActiveDeckIdFromStorage, loadDecksFromStorage, saveStateToStorage } from "@/components/ankiStorage";
import { Deck, Flashcard, QualityScore } from "@/components/ankiTypes";

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>(loadDecksFromStorage);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(loadActiveDeckIdFromStorage);

  const [newDeckName, setNewDeckName] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isAllFlashcardsModalOpen, setIsAllFlashcardsModalOpen] = useState(false);

  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isSidebarPinnedOpen, setIsSidebarPinnedOpen] = useState(false);

  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    saveStateToStorage(decks, activeDeckId);
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
    if (!activeDeck) return [] as Flashcard[];
    return activeDeck.cards.filter((card) => card.dueAt <= nowTs);
  }, [activeDeck, nowTs]);

  const sortedCards = useMemo(() => {
    if (!activeDeck) return [] as Flashcard[];
    return [...activeDeck.cards].sort((a, b) => a.dueAt - b.dueAt);
  }, [activeDeck]);

  const reviewCard = useMemo(() => {
    if (!activeDeck) return null;
    if (reviewCardId) {
      const selected = activeDeck.cards.find((card) => card.id === reviewCardId);
      if (selected) return selected;
    }
    return dueCards[0] ?? null;
  }, [activeDeck, dueCards, reviewCardId]);

  const dueCount = dueCards.length;
  const totalCards = activeDeck?.cards.length ?? 0;
  const progressValue = Math.round(((totalCards - dueCount) / Math.max(totalCards, 1)) * 100);

  const isSidebarExpanded = !isSidebarMinimized || isSidebarPinnedOpen;
  const sidebarContentClass = isSidebarExpanded
    ? "max-h-24 opacity-100 translate-x-0"
    : "max-h-0 opacity-0 -translate-x-1 pointer-events-none";

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

  function rateCurrentCard(q: QualityScore) {
    if (!activeDeckId || !reviewCard) return;

    const now = Date.now();
    const updatedCard = applyRecall(reviewCard, q, now);

    setDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== activeDeckId) return deck;
        return {
          ...deck,
          cards: deck.cards.map((card) => (card.id === reviewCard.id ? updatedCard : card)),
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
    setIsAllFlashcardsModalOpen(false);
    setIsSidebarMinimized(true);
    setIsSidebarPinnedOpen(false);
  }

  function pickCardFromList(cardId: string) {
    setReviewCardId(cardId);
    setShowBack(false);
    setIsAllFlashcardsModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.25),_transparent_42%),linear-gradient(145deg,#f8fafc_0%,#f8fafc_45%,#fff7ed_100%)] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <AnkiHeader hasActiveDeck={Boolean(activeDeck)} onAddFlashcard={() => setIsAddModalOpen(true)} />

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <AnkiSidebar
            decks={decks}
            activeDeckId={activeDeckId}
            nowTs={nowTs}
            isSidebarExpanded={isSidebarExpanded}
            sidebarContentClass={sidebarContentClass}
            isSidebarMinimized={isSidebarMinimized}
            isSidebarPinnedOpen={isSidebarPinnedOpen}
            onHoverEnter={() => setIsSidebarPinnedOpen(true)}
            onHoverLeave={() => setIsSidebarPinnedOpen(false)}
            onMinimizedClickExpand={() => setIsSidebarPinnedOpen(true)}
            onToggleMinimized={() => {
              setIsSidebarMinimized((prev) => !prev);
              setIsSidebarPinnedOpen(false);
            }}
            onOpenAddDeck={() => setIsDeckModalOpen(true)}
            onSwitchDeck={switchDeck}
          />

          <div className="space-y-4 pb-6">
            <AnkiReviewPanel
              activeDeck={activeDeck}
              reviewCard={reviewCard}
              dueCount={dueCount}
              progressValue={progressValue}
              totalCards={totalCards}
              showBack={showBack}
              nowTs={nowTs}
              onShowAnswer={() => setShowBack(true)}
              onRateCard={rateCurrentCard}
              onResetProgress={resetProgress}
              onOpenAddFlashcard={() => setIsAddModalOpen(true)}
            />

            <div className="flex justify-center pt-1">
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                className="font-semibold px-4"
                onPress={() => setIsAllFlashcardsModalOpen(true)}
                isDisabled={!activeDeck || sortedCards.length === 0}
              >
                See All Flashcards
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnkiAddFlashcardModal
        isOpen={isAddModalOpen}
        front={newFront}
        back={newBack}
        onOpenChange={setIsAddModalOpen}
        onFrontChange={setNewFront}
        onBackChange={setNewBack}
        onSave={addCard}
      />

      <AnkiAddDeckModal
        isOpen={isDeckModalOpen}
        name={newDeckName}
        onOpenChange={setIsDeckModalOpen}
        onNameChange={setNewDeckName}
        onCreate={createDeck}
      />

      <AnkiAllFlashcardsModal
        isOpen={isAllFlashcardsModalOpen}
        cards={sortedCards}
        nowTs={nowTs}
        onOpenChange={setIsAllFlashcardsModalOpen}
        onPickCard={pickCardFromList}
      />
    </div>
  );
}
