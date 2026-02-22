import { create } from 'zustand';
import { socket } from '../lib/socket';

export interface Player {
    id: string;
    name: string;
    lore: number;
}

export interface Room {
    id: string;
    players: Player[];
    maxPlayers: number;
}

export interface GameCard {
    uid: string; // Unique instance ID for this specific board
    cardId: string; // The Lorcana API ID
    name: string;
    imageUrl: string;
    ptImageUrl: string | null; // Keep track of the Portuguese image if available
    zone: 'hand' | 'inkwell' | 'field' | 'discard' | 'deck';
    isExerted: boolean;
    damage: number;
}

interface GameState {
    roomId: string | null;
    playerName: string;
    players: Player[];
    connected: boolean;
    myCards: GameCard[];
    opponentCards: Record<string, GameCard[]>; // track cards by player ID
    isPtBr: boolean; // Global toggle for translation
    toggleLanguage: () => void;
    setPlayerName: (name: string) => void;
    connectSocket: () => void;
    createRoom: () => Promise<string>;
    joinRoom: (roomId: string) => Promise<boolean>;
    updateLore: (delta: number) => void;
    spawnCard: (card: { id: string; name: string; imageUrl: string; ptImageUrl?: string }) => void;
    moveCard: (uid: string, toZone: 'hand' | 'inkwell' | 'field' | 'discard' | 'deck') => void;
    toggleExert: (uid: string) => void;
    addDamage: (uid: string) => void;
    removeDamage: (uid: string) => void;
    drawCard: () => void;
    shuffleDeck: () => void;
}

export const useStore = create<GameState>((set, get) => {
    // Setup socket listeners
    socket.on('connect', () => {
        set({ connected: true });
    });

    socket.on('disconnect', () => {
        set({ connected: false, players: [], roomId: null });
    });

    socket.on('player_joined', (players: Player[]) => {
        set({ players });
    });

    socket.on('player_left', (players: Player[]) => {
        set({ players });
    });

    socket.on('room_state_updated', (room: Room) => {
        set({ players: room.players });
    });

    socket.on('opponent_cards_updated', ({ playerId, cards }) => {
        set((state) => ({
            opponentCards: { ...state.opponentCards, [playerId]: cards }
        }));
    });

    return {
        roomId: null,
        playerName: '',
        players: [],
        connected: false,
        myCards: [],
        opponentCards: {},
        isPtBr: true, // Default to Portuguese if available

        toggleLanguage: () => set((state) => ({ isPtBr: !state.isPtBr })),

        setPlayerName: (name: string) => set({ playerName: name }),

        connectSocket: () => {
            if (!socket.connected) {
                socket.connect();
            }
        },

        createRoom: () => {
            return new Promise((resolve) => {
                socket.emit('create_room', (response: { success: boolean; room: Room }) => {
                    if (response.success) {
                        set({ roomId: response.room.id, players: response.room.players });
                        resolve(response.room.id);
                    }
                });
            });
        },

        joinRoom: (roomId: string) => {
            return new Promise((resolve) => {
                const name = get().playerName || 'Guest_' + Math.floor(Math.random() * 1000);
                socket.emit('join_room', { roomId, playerName: name }, (response: { success: boolean; room: Room; error?: string }) => {
                    if (response.success) {
                        set({ roomId: response.room.id, players: response.room.players, playerName: name });
                        resolve(true);
                    } else {
                        console.error(response.error);
                        resolve(false);
                    }
                });
            });
        },

        updateLore: (delta: number) => {
            const state = get();
            if (state.roomId) {
                socket.emit('update_lore', { roomId: state.roomId, delta });
            }
        },

        spawnCard: (card) => {
            const newCard: GameCard = {
                uid: Math.random().toString(36).substring(7),
                cardId: card.id,
                name: card.name,
                imageUrl: card.imageUrl, // Will probably be the EN/Default url passed in
                ptImageUrl: card.ptImageUrl || null,
                zone: 'hand',
                isExerted: false,
                damage: 0,
            };
            const updatedCards = [...get().myCards, newCard];
            set({ myCards: updatedCards });

            const roomId = get().roomId;
            if (roomId) {
                // When syncing to others, we obfuscate cards in hand/deck
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        },

        moveCard: (uid, toZone) => {
            const updatedCards = get().myCards.map(c => c.uid === uid ? { ...c, zone: toZone, isExerted: false } : c);
            set({ myCards: updatedCards });

            const roomId = get().roomId;
            if (roomId) {
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        },

        toggleExert: (uid) => {
            const updatedCards = get().myCards.map(c => c.uid === uid ? { ...c, isExerted: !c.isExerted } : c);
            set({ myCards: updatedCards });

            const roomId = get().roomId;
            if (roomId) {
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        },

        addDamage: (uid) => {
            const updatedCards = get().myCards.map(c => c.uid === uid ? { ...c, damage: c.damage + 1 } : c);
            set({ myCards: updatedCards });

            const roomId = get().roomId;
            if (roomId) {
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        },

        removeDamage: (uid) => {
            const updatedCards = get().myCards.map(c => c.uid === uid && c.damage > 0 ? { ...c, damage: c.damage - 1 } : c);
            set({ myCards: updatedCards });

            const roomId = get().roomId;
            if (roomId) {
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        },

        drawCard: () => {
            const deckCards = get().myCards.filter(c => c.zone === 'deck');
            if (deckCards.length === 0) return;

            const cardToDraw = deckCards[deckCards.length - 1];
            const updatedCards = get().myCards.map(c => c.uid === cardToDraw.uid ? { ...c, zone: 'hand' as const } : c);
            set({ myCards: updatedCards });

            const roomId = get().roomId;
            if (roomId) {
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        },

        shuffleDeck: () => {
            const newCards = [...get().myCards];
            const deckCards = newCards.filter(c => c.zone === 'deck');
            const otherCards = newCards.filter(c => c.zone !== 'deck');

            for (let i = deckCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deckCards[i], deckCards[j]] = [deckCards[j], deckCards[i]];
            }

            const updatedCards = [...otherCards, ...deckCards];
            set({ myCards: updatedCards });

            // Shuffling doesn't change visible card states on board, but we sync anyway
            const roomId = get().roomId;
            if (roomId) {
                const syncedCards = updatedCards.map(c =>
                    (c.zone === 'hand' || c.zone === 'deck')
                        ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
                        : c
                );
                socket.emit('update_cards', { roomId, cards: syncedCards });
            }
        }
    };
});
