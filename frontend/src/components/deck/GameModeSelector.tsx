import React, { useState } from 'react';
import { Users, User, ArrowLeft, Play, Shield } from 'lucide-react';

interface GameModeSelectorProps {
    deckId: string;
    onBack: () => void;
    onStart: (deckId: string, mode: string, team?: 'blue' | 'red') => void;
}

export default function GameModeSelector({ deckId, onBack, onStart }: GameModeSelectorProps) {
    const [mode, setMode] = useState('1v1');
    const [team, setTeam] = useState<'blue' | 'red'>('blue');

    const modes = [
        { id: '1v1', name: '1 vs 1', players: 2, icon: <User size={24} /> },
        { id: '1v1v1', name: 'FFA (3 Jogadores)', players: 3, icon: <Users size={24} /> },
        { id: '1v1v1v1', name: 'FFA (4 Jogadores)', players: 4, icon: <Users size={24} /> },
        { id: '2v2', name: 'Duplas (2 vs 2)', players: 4, icon: <Shield size={24} /> },
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.8),rgba(2,6,23,1))] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
                    <ArrowLeft size={20} /> Voltar para Decks
                </button>

                <h2 className="text-3xl font-black text-white mb-8 text-center italic tracking-tight">
                    MODO DE JOGO
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    {modes.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 ${mode === m.id ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/20' : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'}`}
                        >
                            <div className={`${mode === m.id ? 'text-indigo-400' : 'text-slate-600'}`}>
                                {m.icon}
                            </div>
                            <span className="font-bold">{m.name}</span>
                        </button>
                    ))}
                </div>

                {mode === '2v2' && (
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-center mb-4">Escolha seu Time</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setTeam('blue')}
                                className={`px-8 py-3 rounded-xl border-2 font-black transition-all ${team === 'blue' ? 'border-blue-500 bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20' : 'border-slate-800 text-slate-600 hover:border-blue-900'}`}
                            >
                                BLUE TEAM
                            </button>
                            <button
                                onClick={() => setTeam('red')}
                                className={`px-8 py-3 rounded-xl border-2 font-black transition-all ${team === 'red' ? 'border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20' : 'border-slate-800 text-slate-600 hover:border-red-900'}`}
                            >
                                RED TEAM
                            </button>
                        </div>
                        <p className="text-center text-slate-500 text-xs mt-4">Aliados compartilham o contador de Lore em 2v2</p>
                    </div>
                )}

                <button
                    onClick={() => onStart(deckId, mode, mode === '2v2' ? team : undefined)}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-600/30"
                >
                    <Play size={24} fill="currentColor" />
                    ENTRAR NA ARENA
                </button>
            </div>
        </div>
    );
}
