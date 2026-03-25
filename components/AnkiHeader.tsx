import { Button, Chip } from "@heroui/react";

type AnkiHeaderProps = {
  hasActiveDeck: boolean;
  userEmail: string;
  onAddFlashcard: () => void;
  onSignOut: () => void;
};

export default function AnkiHeader({
  hasActiveDeck,
  userEmail,
  onAddFlashcard,
  onSignOut,
}: AnkiHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Smart Repetition</p>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-zinc-900 sm:text-3xl">
          Anki Deck Lab
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Chip variant="flat" color="default" className="hidden sm:inline-flex">
          {userEmail}
        </Chip>
        <Button
          color="primary"
          variant="shadow"
          className="font-semibold"
          onPress={onAddFlashcard}
          isDisabled={!hasActiveDeck}
        >
          Add Flashcard
        </Button>
        <Button variant="light" onPress={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
