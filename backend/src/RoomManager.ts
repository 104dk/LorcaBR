export interface Player {
    id: string; // Socket UUID
    name: string;
    lore: number;
}

export interface Room {
    id: string;
    players: Player[];
    maxPlayers: number;
}

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(): Room {
        const roomId = this.generateRoomId();
        const newRoom: Room = {
            id: roomId,
            players: [],
            maxPlayers: 4,
        };
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    joinRoom(roomId: string, playerId: string, playerName: string): Room | Error {
        const room = this.rooms.get(roomId);
        if (!room) {
            return new Error('Room not found');
        }
        if (room.players.length >= room.maxPlayers) {
            return new Error('Room is full');
        }
        // Prevent duplicate joining by same socket id
        if (room.players.some((p) => p.id === playerId)) {
            return room; // Already in room
        }

        room.players.push({
            id: playerId,
            name: playerName,
            lore: 0,
        });
        return room;
    }

    leaveRoom(roomId: string, playerId: string): void {
        const room = this.rooms.get(roomId);
        if (room) {
            room.players = room.players.filter((p) => p.id !== playerId);
            if (room.players.length === 0) {
                this.rooms.delete(roomId); // Clean up empty room
            }
        }
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    updatePlayerLore(roomId: string, playerId: string, loreDelta: number): Room | Error {
        const room = this.rooms.get(roomId);
        if (!room) return new Error('Room not found');

        const player = room.players.find((p) => p.id === playerId);
        if (!player) return new Error('Player not in room');

        player.lore = Math.max(0, player.lore + loreDelta); // Prevent negative lore
        return room;
    }

    private generateRoomId(): string {
        return Math.floor(1000 + Math.random() * 9000).toString(); // simple 4-digit code
    }
}

export const globalRoomManager = new RoomManager();
