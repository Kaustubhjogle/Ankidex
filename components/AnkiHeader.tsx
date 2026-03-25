import { Button } from "@heroui/react";

type AnkiHeaderProps = {
  hasActiveDeck: boolean;
  onAddFlashcard: () => void;
};

export default function AnkiHeader({ hasActiveDeck, onAddFlashcard }: AnkiHeaderProps) {
  return (
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
        onPress={onAddFlashcard}
        isDisabled={!hasActiveDeck}
      >
        Add Flashcard
      </Button>
    </div>
  );
}
