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
              <Button color="primary" variant="shadow" onPress={onShowAnswer}>
                Show Answer
              </Button>
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

            <Snippet hideSymbol size="sm" className="bg-zinc-100 text-zinc-600">
              Good answer returns in {formatNextReview(applyRecall(reviewCard, 4, nowTs).dueAt, nowTs)}
            </Snippet>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
