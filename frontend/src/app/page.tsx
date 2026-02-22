"use client";

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';

export default function Home() {
  const [joinCode, setJoinCode] = useState('');
  const [localName, setLocalName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setPlayerName, createRoom, joinRoom, connectSocket } = useStore();

  const handleCreate = async () => {
    if (!localName) return alert('Por favor, insira seu nome!');
    setIsLoading(true);
    setPlayerName(localName);
    connectSocket();
    const roomId = await createRoom();
    router.push(`/room/${roomId}`);
  };

  const handleJoin = async () => {
    if (!localName || !joinCode) return alert('Insira seu nome e o código da sala!');
    setIsLoading(true);
    setPlayerName(localName);
    connectSocket();
    const success = await joinRoom(joinCode);
    if (success) {
      router.push(`/room/${joinCode}`);
    } else {
      alert('Sala não encontrada ou cheia!');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="max-w-md w-full p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-6 text-indigo-400">
          <Swords size={48} />
        </div>
        <h1 className="text-4xl font-bold text-center text-white mb-2 tracking-tight">LorcanaBR</h1>
        <p className="text-center text-slate-400 mb-8">Sua mesa virtual para jogar Lorcana</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Seu Nome</label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Digite seu nickname..."
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-3 font-semibold transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
          >
            {isLoading ? 'Criando...' : 'Criar Nova Sala'}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">ou</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-center tracking-widest"
              placeholder="CÓDIGO (ex: 1234)"
              maxLength={4}
            />
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-6 py-3 font-semibold transition-all disabled:opacity-50"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
