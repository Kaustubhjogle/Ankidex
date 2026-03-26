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
  isCreating: boolean;
  name: string;
  onOpenChange: (isOpen: boolean) => void;
  onNameChange: (value: string) => void;
  onCreate: () => Promise<boolean> | boolean;
};

export default function AnkiAddDeckModal({
  isOpen,
  isCreating,
  name,
  onOpenChange,
  onNameChange,
  onCreate,
}: AnkiAddDeckModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom-center"
      motionProps={{
        initial: { opacity: 0, y: 18, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.97 },
        transition: { duration: 0.24, ease: "easeOut" },
      }}
    >
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
              <Button variant="light" onPress={onClose} isDisabled={isCreating}>
                Cancel
              </Button>
              <Button
                color="primary"
                isLoading={isCreating}
                isDisabled={isCreating}
                onPress={async () => {
                  const created = await onCreate();
                  if (created) onClose();
                }}
              >
                Create Deck
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
