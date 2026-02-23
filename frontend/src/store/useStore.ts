import { create } from 'zustand';
import { socket } from '../lib/socket';

export interface Player {
    id: string;
    name: string;
    lore: number;
    team?: 'blue' | 'red';
}

export interface Room {
    id: string;
    players: Player[];
    maxPlayers: number;
    gameMode: string;
}

/** Special ability flags parsed from the card's Body_Text */
export interface CardAbilities {
    rush?: boolean;
    evasive?: boolean;
    ward?: boolean;
    bodyguard?: boolean;
    reckless?: boolean;
    resist?: number;      // Resist +N
    challenger?: number;  // Challenger +N
    shift?: number;       // Shift N cost
    singer?: number;      // Singer N
    support?: boolean;
}

export interface GameCard {
    uid: string;           // Unique instance ID on this board
    cardId: string;        // API card ID
    name: string;
    imageUrl: string;
    ptImageUrl: string | null;
    zone: 'hand' | 'inkwell' | 'discard' | 'deck' | 'items' | 'ready' | 'exerted' | 'quest';
    isExerted: boolean;
    damage: number;
    // --- Game Stats ---
    strength: number;
    willpower: number;
    loreValue: number;     // Lore gained per quest
    cost: number;
    inkable: boolean;
    isNew: boolean;        // Cannot act on the turn it was played (unless rush)
    abilities: CardAbilities;
    type: string;          // Character | Action | Item | Location | Song
    body_text: string;
    color: string;
}

interface GameState {
    // Room / connection
    roomId: string | null;
    playerName: string;
    players: Player[];
    connected: boolean;
    // Cards
    myCards: GameCard[];
    opponentCards: Record<string, GameCard[]>;
    // Language
    isPtBr: boolean;
    // Turn state
    isMyTurn: boolean;
    hasInkedThisTurn: boolean;
    turnNumber: number;
    // Game over
    gameOver: 'win' | 'lose' | null;
    // Challenge mode
    challengerUid: string | null; // uid of card currently in "attack mode"
    // Game mode & teams
    gameMode: string;          // '1v1' | '1v1v1' | '1v1v1v1' | '2v2'
    myTeam: 'blue' | 'red' | null;
    teamLore: Record<'blue' | 'red', number>;

    // --- Actions ---
    toggleLanguage: () => void;
    setPlayerName: (name: string) => void;
    setGameMode: (mode: string) => void;
    setMyTeam: (team: 'blue' | 'red') => void;
    connectSocket: () => void;
    createRoom: () => Promise<string>;
    joinRoom: (roomId: string) => Promise<boolean>;
    updateLore: (delta: number) => void;
    spawnCard: (card: {
        id: string; name: string; imageUrl: string; ptImageUrl?: string;
        strength?: number; willpower?: number; loreValue?: number;
        cost?: number; inkable?: boolean; abilities?: CardAbilities; type?: string;
        body_text?: string; color?: string;
    }, zone?: GameCard['zone']) => void;
    spawnDeck: (cards: any[]) => void;
    moveCard: (uid: string, toZone: GameCard['zone']) => void;
    toggleExert: (uid: string) => void;
    addDamage: (uid: string) => void;
    removeDamage: (uid: string) => void;
    drawCard: () => void;
    shuffleDeck: () => void;
    endTurn: () => void;
    inkCard: (uid: string) => void;
    questCard: (uid: string) => void;
    setChallengerUid: (uid: string | null) => void;
    challengeCard: (opponentCardUid: string) => void;
    dismissGameOver: () => void;
}

// ---- Helper: sync cards to server (hiding hand/deck) ----
function syncCards(cards: GameCard[], roomId: string) {
    const synced = cards.map(c =>
        (c.zone === 'hand' || c.zone === 'deck')
            ? { ...c, imageUrl: '/card-back.jpg', ptImageUrl: null, name: 'Card' }
            : c
    );
    socket.emit('update_cards', { roomId, cards: synced });
}

export const useStore = create<GameState>((set, get) => {
    // ---- Socket event listeners ----
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false, players: [], roomId: null }));
    socket.on('player_joined', (players: Player[]) => set({ players }));
    socket.on('player_left', (players: Player[]) => set({ players }));
    socket.on('room_state_updated', (room: Room) => {
        const playerName = get().playerName;
        const myPlayer = room.players.find(p => p.name === playerName);

        // Calculate team lore
        const teamLore = { blue: 0, red: 0 };
        room.players.forEach(p => {
            if (p.team === 'blue') teamLore.blue = p.lore;
            if (p.team === 'red') teamLore.red = p.lore;
        });

        const newState: Partial<GameState> = {
            players: room.players,
            gameMode: room.gameMode,
            myTeam: myPlayer?.team || null,
            teamLore
        };

        // BUG 6 FIX: Win condition - if my lore reached 20, trigger win
        const currentGameOver = get().gameOver;
        if (!currentGameOver && myPlayer && myPlayer.lore >= 20) {
            newState.gameOver = 'win';
        }

        set(newState);
    });
    socket.on('opponent_cards_updated', ({ playerId, cards }) => {
        set(state => ({ opponentCards: { ...state.opponentCards, [playerId]: cards } }));
    });
    // Receive turn-end broadcast from opponent
    socket.on('turn_ended', () => {
        set({ isMyTurn: true });
    });
    // Receive challenge damage on our own cards
    socket.on('take_challenge_damage', ({ defenderUid, damage }: { defenderUid: string; damage: number }) => {
        const { myCards } = get();
        let updated = myCards.map(c =>
            c.uid === defenderUid ? { ...c, damage: c.damage + damage } : c
        );
        // Auto-banish if damage >= willpower
        updated = updated.map(c =>
            c.uid === defenderUid && c.damage >= c.willpower && c.willpower > 0
                ? { ...c, zone: 'discard' as const }
                : c
        );
        set({ myCards: updated });
        const { roomId } = get();
        if (roomId) syncCards(updated, roomId);
    });

    return {
        roomId: null,
        playerName: '',
        players: [],
        connected: false,
        myCards: [],
        opponentCards: {},
        isPtBr: true,
        isMyTurn: true,         // Both start as true; real sync handled by endTurn
        hasInkedThisTurn: false,
        turnNumber: 1,
        gameOver: null,
        challengerUid: null,
        gameMode: '1v1',
        myTeam: null,
        teamLore: { blue: 0, red: 0 },

        toggleLanguage: () => set(s => ({ isPtBr: !s.isPtBr })),
        setPlayerName: (name) => set({ playerName: name }),
        setGameMode: (mode) => {
            const { roomId } = get();
            if (roomId) socket.emit('set_game_mode', { roomId, mode });
            set({ gameMode: mode });
        },
        setMyTeam: (team) => {
            const { roomId } = get();
            if (roomId) socket.emit('assign_team', { roomId, team });
            set({ myTeam: team });
        },
        connectSocket: () => { if (!socket.connected) socket.connect(); },

        dismissGameOver: () => set({ gameOver: null }),

        createRoom: () => new Promise(resolve => {
            socket.emit('create_room', (res: { success: boolean; room: Room }) => {
                if (res.success) {
                    set({ roomId: res.room.id, players: res.room.players });
                    resolve(res.room.id);
                }
            });
        }),

        joinRoom: (roomId) => new Promise(resolve => {
            const name = get().playerName || `Guest_${Math.floor(Math.random() * 1000)}`;
            socket.emit('join_room', { roomId, playerName: name }, (res: { success: boolean; room: Room; error?: string }) => {
                if (res.success) {
                    set({ roomId: res.room.id, players: res.room.players, playerName: name });
                    resolve(true);
                } else {
                    console.error(res.error);
                    resolve(false);
                }
            });
        }),

        updateLore: (delta) => {
            const { roomId } = get();
            if (roomId) socket.emit('update_team_lore', { roomId, delta });
        },

        spawnCard: (card, zone = 'hand') => {
            const newCard: GameCard = {
                uid: Math.random().toString(36).substring(7),
                cardId: card.id,
                name: card.name,
                imageUrl: card.imageUrl,
                ptImageUrl: card.ptImageUrl || null,
                zone: zone,
                isExerted: false,
                damage: 0,
                strength: card.strength ?? 0,
                willpower: card.willpower ?? 0,
                loreValue: card.loreValue ?? 0,
                cost: card.cost ?? 0,
                inkable: card.inkable ?? false,
                isNew: false,   // freshness only matters when moved to board
                abilities: card.abilities ?? {},
                type: card.type ?? 'Character',
                body_text: card.body_text ?? '',
                color: card.color ?? 'Unknown',
            };
            const updated = [...get().myCards, newCard];
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);
        },

        spawnDeck: (cards) => {
            const gameCards: GameCard[] = cards.flatMap(dc => {
                const list = [];
                for (let i = 0; i < dc.count; i++) {
                    list.push({
                        uid: Math.random().toString(36).substring(7),
                        cardId: dc.id || dc.cardId,
                        name: dc.name,
                        imageUrl: dc.imageUrl,
                        ptImageUrl: dc.ptImageUrl || null,
                        zone: 'deck' as const,
                        isExerted: false,
                        damage: 0,
                        strength: dc.strength ?? 0,
                        willpower: dc.willpower ?? 0,
                        loreValue: dc.loreValue ?? 0,
                        cost: dc.cost ?? 0,
                        inkable: dc.inkable ?? false,
                        isNew: false,
                        abilities: dc.abilities ?? {},
                        type: dc.type ?? 'Character',
                        body_text: dc.body_text ?? '',
                        color: dc.color ?? 'Unknown',
                    });
                }
                return list;
            });

            // Shuffle
            const shuffledCards = [...gameCards];
            for (let i = shuffledCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
            }

            set({ myCards: shuffledCards });
            const { roomId } = get();
            if (roomId) syncCards(shuffledCards, roomId);
        },

        moveCard: (uid, toZone) => {
            const boardZones: GameCard['zone'][] = ['ready', 'exerted', 'quest', 'items'];
            const updated = get().myCards.map(c => {
                if (c.uid !== uid) return c;
                // BUG 2 FIX: Prevent isNew cards from entering quest zone (same as questCard guard)
                if (toZone === 'quest' && c.isNew && !c.abilities.rush) return c;
                const comingToBoard = boardZones.includes(toZone);
                const wasInHand = c.zone === 'hand';
                return {
                    ...c,
                    zone: toZone,
                    isExerted: toZone === 'quest' ? true : false, // Auto-exert on quest zone
                    isNew: comingToBoard && wasInHand,
                };
            });
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);

            // BUG 2 FIX: If card was moved to quest zone, emit lore gain (like questCard action)
            const movedCard = get().myCards.find(c => c.uid === uid);
            if (toZone === 'quest' && movedCard && movedCard.loreValue > 0 && roomId) {
                socket.emit('update_team_lore', { roomId, delta: movedCard.loreValue });
            }
        },

        toggleExert: (uid) => {
            const updated = get().myCards.map(c => c.uid === uid ? { ...c, isExerted: !c.isExerted } : c);
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);
        },

        addDamage: (uid) => {
            const updated = get().myCards.map(c => c.uid === uid ? { ...c, damage: c.damage + 1 } : c);
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);
        },

        removeDamage: (uid) => {
            const updated = get().myCards.map(c => c.uid === uid && c.damage > 0 ? { ...c, damage: c.damage - 1 } : c);
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);
        },

        drawCard: () => {
            const deck = get().myCards.filter(c => c.zone === 'deck');
            if (deck.length === 0) {
                // Draw from empty deck = lose
                set({ gameOver: 'lose' });
                return;
            }
            const top = deck[deck.length - 1];
            const updated = get().myCards.map(c => c.uid === top.uid ? { ...c, zone: 'hand' as const } : c);
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);
        },

        shuffleDeck: () => {
            const all = [...get().myCards];
            const deck = all.filter(c => c.zone === 'deck');
            const rest = all.filter(c => c.zone !== 'deck');
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            const updated = [...rest, ...deck];
            set({ myCards: updated });
            const { roomId } = get();
            if (roomId) syncCards(updated, roomId);
        },

        // --- Semi-auto: End of Turn ---
        endTurn: () => {
            const { myCards, roomId, turnNumber } = get();
            // 1. Ready all exerted characters and inkwell cards
            const readied = myCards.map(c => ({
                ...c,
                isExerted: false,
                isNew: false, // Cards are no longer "new" after a turn
                // Move exerted cards back to ready zone
                zone: c.zone === 'exerted' ? ('ready' as const) : c.zone,
            }));
            // 2. Draw 1 card (skip on very first action if first turn)
            const deck = readied.filter(c => c.zone === 'deck');
            let final = readied;
            if (deck.length > 0) {
                const top = deck[deck.length - 1];
                final = readied.map(c => c.uid === top.uid ? { ...c, zone: 'hand' as const } : c);
            } else if (deck.length === 0 && readied.some(c => c.zone === 'deck')) {
                set({ gameOver: 'lose' });
                return;
            }

            set({
                myCards: final,
                isMyTurn: false,
                hasInkedThisTurn: false,
                turnNumber: turnNumber + 1,
            });

            if (roomId) {
                syncCards(final, roomId);
                socket.emit('end_turn', { roomId });
            }
        },

        // --- Inkwell (1 per turn, inkable only) ---
        inkCard: (uid) => {
            const { myCards, hasInkedThisTurn, roomId } = get();
            if (hasInkedThisTurn) return; // Already inked
            const card = myCards.find(c => c.uid === uid);
            if (!card || !card.inkable || card.zone !== 'hand') return;
            const updated = myCards.map(c => c.uid === uid ? { ...c, zone: 'inkwell' as const } : c);
            set({ myCards: updated, hasInkedThisTurn: true });
            if (roomId) syncCards(updated, roomId);
        },

        // --- Quest: exert character, gain lore ---
        questCard: (uid) => {
            const { myCards, roomId } = get();
            const card = myCards.find(c => c.uid === uid);
            if (!card) return;
            // Cannot quest if isNew (unless rush — rush only allows challenge, not quest)
            if (card.isNew) return;
            // Move to quest zone + exert
            const updated = myCards.map(c =>
                c.uid === uid ? { ...c, zone: 'quest' as const, isExerted: true } : c
            );
            set({ myCards: updated });
            // Gain lore
            const delta = card.loreValue || 0;
            if (delta > 0 && roomId) {
                // BUG 3 FIX: Use the correct event name that backend listens to
                socket.emit('update_team_lore', { roomId, delta });
            }
            if (roomId) syncCards(updated, roomId);
        },

        // --- Challenge mode ---
        setChallengerUid: (uid) => set({ challengerUid: uid }),

        challengeCard: (opponentCardUid) => {
            const { myCards, opponentCards, challengerUid, roomId } = get();
            if (!challengerUid) return;

            const attacker = myCards.find(c => c.uid === challengerUid);
            if (!attacker || attacker.isNew && !attacker.abilities.rush) {
                set({ challengerUid: null });
                return;
            }

            // Find the opponent card across all opponents
            let defender: GameCard | undefined;
            let defenderId = '';
            for (const [pid, cards] of Object.entries(opponentCards)) {
                const found = cards.find(c => c.uid === opponentCardUid);
                if (found) { defender = found; defenderId = pid; break; }
            }
            if (!defender) { set({ challengerUid: null }); return; }

            // --- Evasive rule: only evasive can challenge evasive ---
            if (defender.abilities.evasive && !attacker.abilities.evasive) {
                set({ challengerUid: null });
                return;
            }

            // --- Bodyguard check: if opponent has exerted bodyguard, must target it ---
            const opponentAllCards = opponentCards[defenderId] || [];
            const bodyguard = opponentAllCards.find(c =>
                c.abilities.bodyguard && c.isExerted && c.uid !== opponentCardUid
            );
            if (bodyguard && bodyguard.uid !== opponentCardUid) {
                set({ challengerUid: null });
                return;
            }

            // --- Calculate damage ---
            const attackerStr = attacker.strength + (attacker.abilities.challenger ?? 0);
            const defenderStr = defender.strength;
            const resistDefender = defender.abilities.resist ?? 0;
            const resistAttacker = attacker.abilities.resist ?? 0;

            const damageToDefender = Math.max(0, attackerStr - resistDefender);
            const damageToAttacker = Math.max(0, defenderStr - resistAttacker);

            // Apply damage to attacker
            let updatedMy = myCards.map(c =>
                c.uid === challengerUid
                    ? { ...c, isExerted: true, zone: 'exerted' as const, damage: c.damage + damageToAttacker }
                    : c
            );
            // Check if attacker is banished
            const attackerAfter = updatedMy.find(c => c.uid === challengerUid)!;
            if (attackerAfter.damage >= attackerAfter.willpower) {
                updatedMy = updatedMy.map(c => c.uid === challengerUid ? { ...c, zone: 'discard' as const } : c);
            }
            set({ myCards: updatedMy, challengerUid: null });
            if (roomId) {
                syncCards(updatedMy, roomId);
                // Tell opponent about damage to their card
                socket.emit('challenge_result', {
                    roomId,
                    defenderUid: opponentCardUid,
                    damage: damageToDefender,
                });
            }
        },
    };
});
