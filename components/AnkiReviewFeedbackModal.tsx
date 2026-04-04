import { Button, Modal, ModalBody, ModalContent } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";

type AnkiReviewFeedbackModalProps = {
  isOpen: boolean;
  label: "Again" | "Hard" | "Good" | "Easy";
  onOpenChange: (isOpen: boolean) => void;
};

const labelToToneClass: Record<AnkiReviewFeedbackModalProps["label"], string> = {
  Again: "text-rose-500 dark:text-rose-300",
  Hard: "text-amber-500 dark:text-amber-300",
  Good: "text-cyan-600 dark:text-cyan-300",
  Easy: "text-emerald-600 dark:text-emerald-300",
};

export default function AnkiReviewFeedbackModal({
  isOpen,
  label,
  onOpenChange,
}: AnkiReviewFeedbackModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      hideCloseButton
      backdrop="blur"
      motionProps={{
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.98 },
        transition: { duration: 0.22, ease: "easeOut" },
      }}
    >
      <ModalContent className="mx-4 rounded-2xl border border-white/30 bg-white/90 p-0 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85">
        {(onClose) => (
          <ModalBody className="p-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-3"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl dark:bg-zinc-800">
                  👍
                </div>
                <p className={`text-xl font-bold ${labelToToneClass[label]}`}>{label}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Response recorded</p>
              </motion.div>
            </AnimatePresence>
            <Button
              size="sm"
              variant="flat"
              className="mt-4"
              onPress={onClose}
            >
              Continue
            </Button>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
}
