import { Button, Chip } from "@heroui/react";

type AnkiHeaderProps = {
  username: string;
  onSignOut: () => void;
};

export default function AnkiHeader({
  username,
  onSignOut,
}: AnkiHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
          Smart Repetition
        </p>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          Ankidex
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <Chip variant="flat" color="default" className="hidden sm:inline-flex">
          @{username}
        </Chip>
        <Button
          variant="light"
          onPress={onSignOut}
          className="text-zinc-800 dark:text-zinc-100"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
