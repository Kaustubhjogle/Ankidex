"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnkiAddDeckModal from "@/components/AnkiAddDeckModal";
import AnkiAddFlashcardModal from "@/components/AnkiAddFlashcardModal";
import AnkiAllFlashcardsModal from "@/components/AnkiAllFlashcardsModal";
import AnkiHeader from "@/components/AnkiHeader";
import AnkiReviewFeedbackModal from "@/components/AnkiReviewFeedbackModal";
import AnkiReviewPanel from "@/components/AnkiReviewPanel";
import AnkiSidebar from "@/components/AnkiSidebar";
import AuthPanel from "@/components/AuthPanel";
import { applyRecall, resetCardProgress } from "@/components/ankiScheduler";
import { Deck, Flashcard, QualityScore } from "@/components/ankiTypes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createCardRecord,
  createDeckRecord,
  fetchUserDecks,
  resetDeckReviews,
  upsertCardReviewRecord,
} from "@/lib/supabase/ankiRepository";

export default function Home() {
  const [supabase] = useState(createSupabaseBrowserClient);
  const missingSupabaseConfig = !supabase;
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(() => missingSupabaseConfig);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoadingAction, setAuthLoadingAction] = useState<"signin" | "signup" | null>(null);
  const [authCooldownUntil, setAuthCooldownUntil] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(() =>
    missingSupabaseConfig
      ? "Missing Supabase keys. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
      : null
  );

  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [newDeckName, setNewDeckName] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isAllFlashcardsModalOpen, setIsAllFlashcardsModalOpen] = useState(false);

  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [isSidebarPinnedOpen, setIsSidebarPinnedOpen] = useState(false);
  const [againFlashBurstId, setAgainFlashBurstId] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState<{
    isOpen: boolean;
    label: "Again" | "Hard" | "Good" | "Easy";
  }>({ isOpen: false, label: "Good" });
  const againAudioRef = useRef<HTMLAudioElement | null>(null);

  const [reviewCardId, setReviewCardId] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ankidex-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem("ankidex-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const audio = new Audio("/sounds/fahhh_KcgAXfs.mp3");
    audio.preload = "auto";
    againAudioRef.current = audio;
    return () => {
      audio.pause();
      againAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!reviewFeedback.isOpen) return;
    const timer = window.setTimeout(
      () => setReviewFeedback((prev) => ({ ...prev, isOpen: false })),
      1200
    );
    return () => window.clearTimeout(timer);
  }, [reviewFeedback.isOpen]);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) return;
      if (error && !error.message.toLowerCase().includes("auth session missing")) {
        setAuthError(error.message);
      }
      setAuthUser(data.user ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        setAuthError(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !authUser) return;

    let cancelled = false;

    const load = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const loadedDecks = await fetchUserDecks(supabase, authUser.id);
        if (cancelled) return;

        setDecks(loadedDecks);
        setActiveDeckId((prev) => {
          if (prev && loadedDecks.some((deck) => deck.id === prev)) return prev;
          return loadedDecks[0]?.id ?? null;
        });
      } catch (error) {
        if (cancelled) return;
        setDataError(error instanceof Error ? error.message : "Could not load decks.");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [supabase, authUser]);

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
  const displayUsername =
    (authUser?.user_metadata?.username as string | undefined)?.trim() ||
    authUser?.email?.split("@")[0] ||
    "user";

  const isSidebarExpanded = !isSidebarMinimized || isSidebarPinnedOpen;
  const sidebarContentClass = isSidebarExpanded
    ? "max-h-24 opacity-100 translate-x-0"
    : "max-h-0 opacity-0 -translate-x-1 pointer-events-none";

  const appThemeToggle = (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-5 sm:right-5">
      <Button
        isIconOnly
        size="sm"
        variant="flat"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="h-9 w-9 min-w-0 rounded-full border border-zinc-200/80 bg-white/70 text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/65 dark:text-zinc-200"
        onPress={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1Zm0 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm7.5-3.5h-1.5a1 1 0 1 1 0-2h1.5a1 1 0 1 1 0 2Zm-13.5 0H4.5a1 1 0 1 1 0-2H6a1 1 0 1 1 0 2Zm9.19 4.19a1 1 0 0 1 1.41 0l1.06 1.06a1 1 0 1 1-1.41 1.41l-1.06-1.06a1 1 0 0 1 0-1.41Zm-8.38 0a1 1 0 0 1 0 1.41L5.75 19.66a1 1 0 0 1-1.41-1.41l1.06-1.06a1 1 0 0 1 1.41 0Zm8.38-10.38a1 1 0 0 1 0-1.41l1.06-1.06a1 1 0 1 1 1.41 1.41L16.6 6.81a1 1 0 0 1-1.41 0Zm-8.38 0a1 1 0 0 1-1.41 0L4.34 5.75A1 1 0 1 1 5.75 4.34l1.06 1.06a1 1 0 0 1 0 1.41Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M19.2 15.5A7.5 7.5 0 0 1 8.5 4.8a.75.75 0 0 0-.95-.95A9 9 0 1 0 20.15 16.45a.75.75 0 0 0-.95-.95Z" />
          </svg>
        )}
      </Button>
    </div>
  );

  async function createDeck(): Promise<boolean> {
    if (!supabase || !authUser || isCreatingDeck) return false;

    const name = newDeckName.trim();
    if (!name) return false;

    setDataError(null);
    setIsCreatingDeck(true);
    try {
      const deck = await createDeckRecord(supabase, authUser.id, name);
      setDecks((prev) => [deck, ...prev]);
      setActiveDeckId(deck.id);
      setNewDeckName("");
      setReviewCardId(null);
      setShowBack(false);
      return true;
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not create deck.");
      return false;
    } finally {
      setIsCreatingDeck(false);
    }
  }

  async function addCard(): Promise<boolean> {
    if (!supabase || !authUser || !activeDeckId || isSavingCard) return false;

    const front = newFront.trim();
    const back = newBack.trim();
    if (!front || !back) return false;

    setDataError(null);
    setIsSavingCard(true);
    try {
      const card = await createCardRecord(supabase, authUser.id, activeDeckId, front, back);

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
      setReviewCardId(card.id);
      setShowBack(false);
      setNowTs(Date.now());
      return true;
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not add card.");
      return false;
    } finally {
      setIsSavingCard(false);
    }
  }

  async function rateCurrentCard(q: QualityScore) {
    if (!supabase || !authUser || !activeDeckId || !reviewCard) return;
    const labelMap: Record<QualityScore, "Again" | "Hard" | "Good" | "Easy"> = {
      0: "Again",
      3: "Hard",
      4: "Good",
      5: "Easy",
    };
    setReviewFeedback({ isOpen: true, label: labelMap[q] });
    if (q === 0) {
      setAgainFlashBurstId((prev) => prev + 1);
      if (againAudioRef.current) {
        againAudioRef.current.currentTime = 0;
        void againAudioRef.current.play().catch(() => {});
      }
    }

    const now = Date.now();
    const updatedCard = applyRecall(reviewCard, q, now);

    setDataError(null);
    try {
      await upsertCardReviewRecord(supabase, authUser.id, updatedCard);

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
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not update review.");
    }
  }

  async function resetProgress() {
    if (!supabase || !authUser || !activeDeckId || !activeDeck) return;

    const now = Date.now();
    const resetCards = activeDeck.cards.map((card) => resetCardProgress(card, now));

    setDataError(null);
    try {
      await resetDeckReviews(supabase, authUser.id, activeDeck.cards, now);

      setDecks((prev) =>
        prev.map((deck) => {
          if (deck.id !== activeDeckId) return deck;
          return {
            ...deck,
            cards: resetCards,
          };
        })
      );

      setReviewCardId(null);
      setShowBack(false);
      setNowTs(now);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not reset progress.");
    }
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

  function getAuthErrorMessage(error: { message?: string; status?: number } | null | undefined) {
    if (!error) return "Auth request failed. Please try again.";
    const message = (error.message ?? "").toLowerCase();

    if (error.status === 429 || message.includes("rate limit")) {
      setAuthCooldownUntil(Date.now() + 60_000);
      return "Too many attempts right now. Wait about a minute, then try again.";
    }

    if (message.includes("failed to fetch")) {
      return "Could not reach Supabase. Check your internet and Supabase URL/key, then try again.";
    }

    if (message.includes("invalid login credentials")) {
      return "Email or password is incorrect.";
    }

    if (message.includes("duplicate key") || message.includes("profiles_username_key")) {
      return "That username is taken. Try another one.";
    }

    return error.message ?? "Auth request failed. Please try again.";
  }

  async function signIn() {
    if (!supabase) return;
    if (Date.now() < authCooldownUntil) {
      const waitSeconds = Math.ceil((authCooldownUntil - Date.now()) / 1000);
      setAuthError(`Please wait ${waitSeconds}s before trying again.`);
      return;
    }

    const normalizedEmail = authEmail.trim().toLowerCase();

    if (!normalizedEmail || !authPassword) {
      setAuthError("Enter email and password.");
      return;
    }

    setAuthLoadingAction("signin");
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: authPassword,
    });

    if (error) setAuthError(getAuthErrorMessage(error));
    setAuthLoadingAction(null);
  }

  async function signUp() {
    if (!supabase) return;
    if (Date.now() < authCooldownUntil) {
      const waitSeconds = Math.ceil((authCooldownUntil - Date.now()) / 1000);
      setAuthError(`Please wait ${waitSeconds}s before trying again.`);
      return;
    }

    const normalizedEmail = authEmail.trim().toLowerCase();
    const normalizedUsername = authUsername.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !authPassword) {
      setAuthError("Enter username, email, and password.");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setAuthError("Username must be 3-20 chars, lowercase letters, numbers, or underscores.");
      return;
    }

    setAuthLoadingAction("signup");
    setAuthError(null);

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: authPassword,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    if (error) {
      setAuthError(getAuthErrorMessage(error));
    } else {
      setAuthError("Account created. Check your email to verify, then sign in.");
      setAuthUsername("");
      setAuthMode("signin");
    }

    setAuthLoadingAction(null);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthUser(null);
    setAuthError(null);
    setAuthUsername("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthMode("signin");
    setDecks([]);
    setActiveDeckId(null);
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.25),_transparent_42%),linear-gradient(145deg,#f8fafc_0%,#f8fafc_45%,#fff7ed_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_42%),linear-gradient(145deg,#020617_0%,#0f172a_55%,#111827_100%)] sm:px-6">
        {appThemeToggle}
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <p className="text-zinc-600 dark:text-zinc-300">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <>
        {appThemeToggle}
        <AuthPanel
          username={authUsername}
          email={authEmail}
          password={authPassword}
          mode={authMode}
          loading={authLoadingAction === authMode}
          error={authError}
          onUsernameChange={setAuthUsername}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onSubmit={authMode === "signup" ? signUp : signIn}
          onToggleMode={() => {
            setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"));
            setAuthError(null);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.25),_transparent_42%),linear-gradient(145deg,#f8fafc_0%,#f8fafc_45%,#fff7ed_100%)] px-3 py-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_42%),linear-gradient(145deg,#020617_0%,#0f172a_55%,#111827_100%)] sm:px-5 sm:py-6">
      {appThemeToggle}
      <AnimatePresence>
        {againFlashBurstId > 0 ? (
          <motion.div
            key={againFlashBurstId}
            className="pointer-events-none fixed inset-0 z-[40] bg-red-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.18, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => setAgainFlashBurstId(0)}
          />
        ) : null}
      </AnimatePresence>
      <div className="mx-auto max-w-6xl">
        <AnkiHeader
          username={displayUsername}
          onSignOut={signOut}
        />

        {dataError ? (
          <p className="mb-3 rounded-xl border border-danger/30 bg-danger-50 px-3 py-2 text-sm text-danger dark:bg-danger-500/10 dark:text-danger-300">
            {dataError}
          </p>
        ) : null}

        {dataLoading ? <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">Syncing your decks...</p> : null}

        <div className="grid gap-4 md:items-start md:grid-cols-[auto_1fr]">
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

            <div className="flex justify-center gap-2 pt-1">
              <Button
                color="primary"
                variant="flat"
                size="sm"
                className="px-4 font-semibold dark:bg-cyan-500/15 dark:text-cyan-200"
                onPress={() => setIsAddModalOpen(true)}
                isDisabled={!activeDeck}
              >
                Add Flashcard
              </Button>
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                className="px-4 font-semibold dark:bg-violet-500/15 dark:text-violet-200"
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
        isSaving={isSavingCard}
        front={newFront}
        back={newBack}
        onOpenChange={setIsAddModalOpen}
        onFrontChange={setNewFront}
        onBackChange={setNewBack}
        onSave={addCard}
      />

      <AnkiAddDeckModal
        isOpen={isDeckModalOpen}
        isCreating={isCreatingDeck}
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

      <AnkiReviewFeedbackModal
        isOpen={reviewFeedback.isOpen}
        label={reviewFeedback.label}
        onOpenChange={(isOpen) =>
          setReviewFeedback((prev) => ({
            ...prev,
            isOpen,
          }))
        }
      />
    </div>
  );
}
