import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

type AnkiAddDeckModalProps = {
  isOpen: boolean;
  name: string;
  onOpenChange: (isOpen: boolean) => void;
  onNameChange: (value: string) => void;
  onCreate: () => void;
};

export default function AnkiAddDeckModal({
  isOpen,
  name,
  onOpenChange,
  onNameChange,
  onCreate,
}: AnkiAddDeckModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom-center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">New Deck</ModalHeader>
            <ModalBody>
              <Input
                autoFocus
                value={name}
                onValueChange={onNameChange}
                variant="bordered"
                placeholder="Deck name"
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={onCreate}>
                Create Deck
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
