import { Button, Card, CardBody, CardHeader, Chip, Progress, Snippet } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Deck, Flashcard } from "@/components/ankiTypes";
import { applyRecall, formatNextReview } from "@/components/ankiScheduler";

type AnkiReviewPanelProps = {
  activeDeck: Deck | null;
  reviewCard: Flashcard | null;
  dueCount: number;
  progressValue: number;
  totalCards: number;
  showBack: boolean;
  nowTs: number;
  onShowAnswer: () => void;
  onRateCard: (q: 0 | 3 | 4 | 5) => void;
  onResetProgress: () => void;
  onOpenAddFlashcard: () => void;
};

export default function AnkiReviewPanel({
  activeDeck,
  reviewCard,
  dueCount,
  progressValue,
  totalCards,
  showBack,
  nowTs,
  onShowAnswer,
  onRateCard,
  onResetProgress,
  onOpenAddFlashcard,
}: AnkiReviewPanelProps) {
  return (
    <Card className="border border-white/70 bg-white/90 shadow-xl shadow-indigo-100/60 backdrop-blur dark:border-zinc-700/80 dark:bg-zinc-900/70 dark:shadow-none">
      <CardHeader className="flex-col items-start gap-3">
        <div className="flex w-full items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-zinc-900 dark:text-zinc-100 sm:text-xl">
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pick a deck from the sidebar to start.</p>
        ) : !reviewCard ? (
          <div className="space-y-3">
            <p className="font-medium text-zinc-800 dark:text-zinc-100">
              {totalCards === 0 ? "No cards yet in this deck." : "You covered all cards for now."}
            </p>
            {totalCards > 0 ? (
              <Button color="primary" variant="flat" onPress={onResetProgress} className="font-semibold">
                Reset Progress
              </Button>
            ) : (
              <Button color="primary" variant="flat" onPress={onOpenAddFlashcard}>
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
                className="min-h-[240px] rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-5 shadow-inner dark:border-zinc-700/80 dark:bg-zinc-900/70"
              >
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {showBack ? "Back" : "Front"}
                </p>
                <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100 sm:text-lg">
                  {showBack ? reviewCard.back : reviewCard.front}
                </p>
              </motion.div>
            </AnimatePresence>

            {!showBack ? (
              <div className="flex justify-center">
                <Button color="primary" variant="shadow" onPress={onShowAnswer}>
                  Show Answer
                </Button>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-4">
                <Button color="danger" variant="flat" onPress={() => onRateCard(0)}>
                  Again (0)
                </Button>
                <Button color="warning" variant="flat" onPress={() => onRateCard(3)}>
                  Hard (3)
                </Button>
                <Button color="primary" variant="flat" onPress={() => onRateCard(4)}>
                  Good (4)
                </Button>
                <Button color="success" variant="flat" onPress={() => onRateCard(5)}>
                  Easy (5)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
