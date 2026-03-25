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
  front: string;
  back: string;
  onOpenChange: (isOpen: boolean) => void;
  onFrontChange: (value: string) => void;
  onBackChange: (value: string) => void;
  onSave: () => void;
};

export default function AnkiAddFlashcardModal({
  isOpen,
  front,
  back,
  onOpenChange,
  onFrontChange,
  onBackChange,
  onSave,
}: AnkiAddFlashcardModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom-center" scrollBehavior="inside">
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
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={onSave}>
                Save Card
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
