import { create } from 'zustand';

export interface DeckCard {
    cardId: string;
    name: string;
    imageUrl: string;
    count: number;
    cost: number;
    type: string;
    color: string;
    strength: number;
    willpower: number;
    loreValue: number;
    inkable: boolean;
}

export interface SavedDeck {
    id: string;
    name: string;
    cards: DeckCard[];
    createdAt: number;
}

interface DeckState {
    decks: SavedDeck[];
    activeDeckId: string | null;
    loadDecks: () => void;
    saveDeck: (deck: Omit<SavedDeck, 'id' | 'createdAt'>) => void;
    updateDeck: (id: string, deck: Partial<SavedDeck>) => void;
    deleteDeck: (id: string) => void;
    exportDeck: (id: string) => void;
    importDeck: (json: string) => SavedDeck | null;
    setActiveDeck: (id: string | null) => void;
}

const STORAGE_KEY = 'LorcanaBR_SavedDecks';

export const useDeckStore = create<DeckState>((set, get) => ({
    decks: [],
    activeDeckId: null,

    loadDecks: () => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            set({ decks: JSON.parse(stored) });
        }
    },

    saveDeck: (deck) => {
        const newDeck: SavedDeck = {
            ...deck,
            id: Math.random().toString(36).substring(7),
            createdAt: Date.now(),
        };
        const updated = [...get().decks, newDeck].slice(0, 3); // Max 3 decks
        set({ decks: updated });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    updateDeck: (id, partial) => {
        const updated = get().decks.map(d => d.id === id ? { ...d, ...partial } : d);
        set({ decks: updated });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    deleteDeck: (id) => {
        const updated = get().decks.filter(d => d.id !== id);
        set({ decks: updated });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    exportDeck: (id) => {
        const deck = get().decks.find(d => d.id === id);
        if (!deck) return;
        const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lorcana-deck-${deck.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importDeck: (json) => {
        try {
            const imported = JSON.parse(json) as SavedDeck;
            if (!imported.name || !Array.isArray(imported.cards)) return null;

            const newDeck: SavedDeck = {
                ...imported,
                id: Math.random().toString(36).substring(7),
                createdAt: Date.now(),
            };

            const updated = [...get().decks, newDeck].slice(0, 3);
            set({ decks: updated });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return newDeck;
        } catch (e) {
            return null;
        }
    },

    setActiveDeck: (id) => set({ activeDeckId: id }),
}));
