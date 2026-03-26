import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";

type AnkiAddFlashcardModalProps = {
  isOpen: boolean;
  isSaving: boolean;
  front: string;
  back: string;
  onOpenChange: (isOpen: boolean) => void;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  onSave: () => Promise<boolean> | boolean;
};

export default function AnkiAddFlashcardModal({
  isOpen,
  isSaving,
  front,
  back,
  onOpenChange,
  onFrontChange,
  onBackChange,
  onSave,
}: AnkiAddFlashcardModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom-center"
      scrollBehavior="inside"
      motionProps={{
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.96 },
        transition: { duration: 0.22, ease: "easeOut" },
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Add Flashcard</ModalHeader>
            <ModalBody className="space-y-2">
              <Textarea
                value={front}
                onValueChange={onFrontChange}
                label="Front"
                labelPlacement="outside"
                minRows={2}
                placeholder="Type your question"
                variant="bordered"
              />
              <Textarea
                value={back}
                onValueChange={onBackChange}
                label="Back"
                labelPlacement="outside"
                minRows={2}
                placeholder="Type your answer"
                variant="bordered"
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isSaving}>
                Cancel
              </Button>
              <Button
                color="primary"
                isLoading={isSaving}
                isDisabled={isSaving}
                onPress={async () => {
                  const saved = await onSave();
                  if (saved) onClose();
                }}
              >
                Save Card
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
