"use client";

import React from 'react';
import DeckManager from '../../components/deck/DeckManager';
import { useStore } from '../../store/useStore';
import { useRouter } from 'next/navigation';

export default function DeckManagerPage() {
    const { setPlayerName, connectSocket, createRoom, setGameMode, setMyTeam } = useStore();
    const router = useRouter();

    const handleStartGame = async (deckId: string, mode: string, team?: 'blue' | 'red') => {
        // We need a name to join/create a room
        let name = useStore.getState().playerName;
        if (!name) {
            name = prompt('Digite seu nickname para entrar na arena:') || 'Jogador';
            setPlayerName(name);
        }

        connectSocket();
        const roomId = await createRoom();

        // Update room with selected mode and team using store actions
        setGameMode(mode);
        if (team) {
            setMyTeam(team);
        }

        // Navigate to room
        router.push(`/room/${roomId}?deckId=${deckId}`);
    };

    return (
        <main className="min-h-screen bg-slate-950">
            <DeckManager onStartGame={handleStartGame} />
        </main>
    );
}
