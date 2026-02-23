"use client";

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/navigation';
import { Swords, BookOpen, PlusCircle } from 'lucide-react';

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
      <div className="max-w-md w-full p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 blur-[100px] pointer-events-none" />

        <div className="flex justify-center mb-6 text-indigo-400 relative">
          <Swords size={48} className="drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
        </div>
        <h1 className="text-4xl font-bold text-center text-white mb-2 tracking-tight">LorcanaBR</h1>
        <p className="text-center text-slate-400 mb-8">Sua mesa virtual para jogar Lorcana</p>

        <div className="space-y-6">
          {/* Deck Manager Quick Link */}
          <button
            onClick={() => router.push('/deck-manager')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all font-bold mb-4"
          >
            <BookOpen size={18} />
            Gerenciar Meus Decks
          </button>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Seu Nome</label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              placeholder="Digite seu nickname..."
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-4 font-black text-lg transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Criando...' : (
              <>
                <PlusCircle size={20} />
                Criar Nova Sala
              </>
            )}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-widest">ou entrar em uma</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-center tracking-[0.2em] font-mono text-xl"
              placeholder="0000"
              maxLength={4}
            />
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-6 py-3 font-bold border border-slate-700 transition-all disabled:opacity-50"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
