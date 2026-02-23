import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { globalRoomManager } from './RoomManager';

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // We will restrict this to the Next.js frontend URL later
        methods: ['GET', 'POST'],
    },
});

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('LorcanaBR Backend Running');
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('create_room', (callback) => {
        const room = globalRoomManager.createRoom();
        socket.join(room.id);
        console.log(`Socket ${socket.id} created room ${room.id}`);
        callback({ success: true, room });
    });

    socket.on('join_room', ({ roomId, playerName }, callback) => {
        const result = globalRoomManager.joinRoom(roomId, socket.id, playerName);
        if (result instanceof Error) {
            return callback({ success: false, error: result.message });
        }

        socket.join(roomId);

        // Notify others in room
        socket.to(roomId).emit('player_joined', result.players);
        console.log(`Socket ${socket.id} joined room ${roomId}`);

        callback({ success: true, room: result });
    });

    socket.on('update_lore', ({ roomId, delta }) => {
        const result = globalRoomManager.updatePlayerLore(roomId, socket.id, delta);
        if (!(result instanceof Error)) {
            io.to(roomId).emit('room_state_updated', result);
        }
    });

    socket.on('set_game_mode', ({ roomId, mode }) => {
        const result = globalRoomManager.setGameMode(roomId, mode);
        if (!(result instanceof Error)) {
            io.to(roomId).emit('room_state_updated', result);
        }
    });

    socket.on('assign_team', ({ roomId, team }) => {
        const result = globalRoomManager.setPlayerTeam(roomId, socket.id, team);
        if (!(result instanceof Error)) {
            io.to(roomId).emit('room_state_updated', result);
        }
    });

    socket.on('update_cards', ({ roomId, cards }) => {
        socket.to(roomId).emit('opponent_cards_updated', { playerId: socket.id, cards });
    });

    socket.on('end_turn', ({ roomId }) => {
        socket.to(roomId).emit('turn_ended');
    });

    socket.on('challenge_result', ({ roomId, defenderUid, damage }) => {
        socket.to(roomId).emit('take_challenge_damage', { defenderUid, damage });
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach((roomId) => {
            globalRoomManager.leaveRoom(roomId, socket.id);
            const room = globalRoomManager.getRoom(roomId);
            if (room) {
                io.to(roomId).emit('player_left', room.players);
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
