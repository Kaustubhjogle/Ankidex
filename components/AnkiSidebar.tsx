import { Badge, Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Deck } from "@/components/ankiTypes";

type AnkiSidebarProps = {
  decks: Deck[];
  activeDeckId: string | null;
  nowTs: number;
  isSidebarExpanded: boolean;
  sidebarContentClass: string;
  isSidebarMinimized: boolean;
  isSidebarPinnedOpen: boolean;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onMinimizedClickExpand: () => void;
  onToggleMinimized: () => void;
  onOpenAddDeck: () => void;
  onSwitchDeck: (deckId: string) => void;
};

export default function AnkiSidebar({
  decks,
  activeDeckId,
  nowTs,
  isSidebarExpanded,
  sidebarContentClass,
  isSidebarMinimized,
  isSidebarPinnedOpen,
  onHoverEnter,
  onHoverLeave,
  onMinimizedClickExpand,
  onToggleMinimized,
  onOpenAddDeck,
  onSwitchDeck,
}: AnkiSidebarProps) {
  return (
    <Card
      className={`border border-white/70 bg-white/85 shadow-xl shadow-sky-100/60 backdrop-blur md:h-[calc(100vh-120px)] md:sticky md:top-4 transition-[width] duration-300 ease-out ${
        isSidebarExpanded ? "md:w-[260px]" : "md:w-[84px]"
      }`}
      onMouseEnter={() => {
        if (isSidebarMinimized) onHoverEnter();
      }}
      onMouseLeave={() => {
        if (isSidebarMinimized) onHoverLeave();
      }}
      onClick={() => {
        if (isSidebarMinimized && !isSidebarPinnedOpen) onMinimizedClickExpand();
      }}
    >
      <CardHeader className="pb-2">
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-zinc-900">
              Decks
            </h2>
            <div className="flex items-center gap-2">
              <div className={`overflow-hidden transition-all duration-200 ease-out ${sidebarContentClass}`}>
                <Badge color="primary" variant="flat">
                  {decks.length}
                </Badge>
              </div>
              <Button size="sm" variant="light" isIconOnly onPress={onToggleMinimized}>
                {isSidebarExpanded ? "−" : "+"}
              </Button>
            </div>
          </div>
          <div className={`overflow-hidden transition-all duration-200 ease-out ${sidebarContentClass}`}>
            <Button color="secondary" className="font-semibold w-full" onPress={onOpenAddDeck}>
              Add Deck
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        {decks.length === 0 ? (
          <p className="text-sm text-zinc-500">Create a deck to get started.</p>
        ) : (
          <div className="space-y-2 overflow-x-auto md:overflow-y-auto">
            {decks.map((deck) => {
              const due = deck.cards.filter((card) => card.dueAt <= nowTs).length;
              const selected = deck.id === activeDeckId;

              return (
                <button
                  key={deck.id}
                  onClick={() => onSwitchDeck(deck.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-blue-300 bg-blue-50/80 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="relative min-h-10">
                    <div
                      className={`transition-all duration-200 ease-out ${
                        isSidebarExpanded
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-1 pointer-events-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900 truncate">{deck.name}</p>
                        <Chip size="sm" color={due > 0 ? "warning" : "success"} variant="flat">
                          {due}
                        </Chip>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{deck.cards.length} Cards</p>
                    </div>
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
                        isSidebarExpanded
                          ? "opacity-0 scale-95 pointer-events-none"
                          : "opacity-100 scale-100"
                      }`}
                    >
                      <Chip size="sm" color={due > 0 ? "warning" : "success"} variant="flat">
                        {due}
                      </Chip>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
