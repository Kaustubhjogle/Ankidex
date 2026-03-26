import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { Flashcard } from "@/components/ankiTypes";
import { formatNextReview } from "@/components/ankiScheduler";

type AnkiAllFlashcardsModalProps = {
  isOpen: boolean;
  cards: Flashcard[];
  nowTs: number;
  onOpenChange: (isOpen: boolean) => void;
  onPickCard: (cardId: string) => void;
};

export default function AnkiAllFlashcardsModal({
  isOpen,
  cards,
  nowTs,
  onOpenChange,
  onPickCard,
}: AnkiAllFlashcardsModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom-center" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">All Flashcards</ModalHeader>
            <ModalBody className="space-y-2">
              {cards.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No flashcards yet in this deck.</p>
              ) : (
                cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onPickCard(card.id)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:border-zinc-600"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Front</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {card.front}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Chip size="sm" color={card.dueAt <= nowTs ? "warning" : "default"} variant="flat">
                        {card.dueAt <= nowTs ? "Due Now" : `In ${formatNextReview(card.dueAt, nowTs)}`}
                      </Chip>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Reviews: {card.reviews}</p>
                    </div>
                  </button>
                ))
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
