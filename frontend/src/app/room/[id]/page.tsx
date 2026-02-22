"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useStore } from '../../../store/useStore';
import { Users, LogOut, Search as SearchIcon, Globe } from 'lucide-react';
import CardGallery from '../../../components/game/CardGallery';
import Card from '../../../components/game/Card';
import DroppableZone from '../../../components/game/DroppableZone';

export default function GameRoom() {
    const params = useParams();
    const roomId = params.id as string;
    const router = useRouter();
    const [showGallery, setShowGallery] = useState(false);

    const { players, connected, joinRoom, playerName, myCards, moveCard, toggleExert, addDamage, removeDamage, isPtBr, toggleLanguage, drawCard, shuffleDeck } = useStore();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id) {
            moveCard(active.id as string, over.id as any);
        }
    };

    useEffect(() => {
        // If user refreshes or comes straight to URL, we need them to have a name
        if (!playerName) {
            router.push('/');
            return;
        }

        // Automatically try to join if we navigated here
        joinRoom(roomId);
    }, [roomId, playerName, joinRoom, router]);

    if (!connected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <p className="animate-pulse">Conectando ao servidor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center shadow-lg z-50">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">LorcanaBR</h1>
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        <span className="text-slate-400 text-sm font-medium">Sala:</span>
                        <span className="text-white font-mono font-bold tracking-widest">{roomId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleLanguage}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors border ${isPtBr ? 'text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'}`}
                    >
                        <Globe size={18} />
                        <span>{isPtBr ? 'PT-BR' : 'EN'}</span>
                    </button>

                    <button
                        onClick={() => setShowGallery(true)}
                        className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors bg-indigo-500/10 px-4 py-2 rounded-lg hover:bg-indigo-500/20 border border-indigo-500/30 font-semibold"
                    >
                        <SearchIcon size={18} />
                        <span>Adicionar Carta</span>
                    </button>

                    <div className="flex items-center gap-2 text-slate-300">
                        <Users size={18} className="text-indigo-400" />
                        <span className="font-medium">{players.length}/4 Jogadores</span>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded-md hover:bg-red-400/20"
                    >
                        <LogOut size={16} />
                        <span className="text-sm font-medium">Sair</span>
                    </button>
                </div>
            </header>

            {/* Main Game Area */}
            <DndContext onDragEnd={handleDragEnd}>
                <main className="flex-grow flex relative overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.5),rgba(2,6,23,1))]">

                    {/* Playmat Grid System */}
                    <div className="w-full h-full p-6 flex flex-col gap-6">

                        {/* Opponents Area (Top) */}
                        <div className="flex-1 flex justify-center items-start gap-4 p-4 border border-slate-800/50 rounded-2xl bg-slate-900/20">
                            {players.filter(p => p.name !== playerName).map((opponent) => (
                                <div key={opponent.id} className="w-64 h-32 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-4 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <h3 className="text-slate-200 font-bold mb-1">{opponent.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-amber-400 font-bold text-2xl">{opponent.lore}</span>
                                        <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Lore</span>
                                    </div>
                                </div>
                            ))}
                            {players.length === 1 && (
                                <div className="text-slate-500 font-medium italic flex items-center justify-center w-full h-full">
                                    Aguardando oponentes entrarem na sala...
                                </div>
                            )}
                        </div>

                        {/* Central Field Area */}
                        <DroppableZone id="field" className="flex-[2] border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-900/10 flex flex-wrap gap-4 items-center justify-center relative shadow-inner p-4 min-h-[300px]">
                            {myCards.filter(c => c.zone === 'field').length === 0 && (
                                <span className="text-slate-600 font-bold text-2xl uppercase tracking-[0.2em] select-none pointer-events-none absolute opacity-20">
                                    Campo de Batalha
                                </span>
                            )}
                            {myCards.filter(c => c.zone === 'field').map(card => (
                                <Card
                                    key={card.uid}
                                    card={card}
                                    onExert={toggleExert}
                                    onAddDamage={addDamage}
                                    onRemoveDamage={removeDamage}
                                />
                            ))}
                        </DroppableZone>

                        {/* My Player Area (Bottom) */}
                        <div className="flex-1 flex justify-between items-end gap-6 h-48">

                            {/* Left side: Deck, Discard & Inkwell */}
                            <div className="w-1/4 h-full flex flex-col gap-2">
                                {/* Deck & Discard Top */}
                                <div className="flex h-1/2 gap-2">
                                    <DroppableZone id="deck" className="flex-1 bg-slate-900/60 rounded-xl border border-slate-700 p-2 relative flex flex-col items-center justify-center group overflow-hidden">
                                        <div onClick={drawCard} className="absolute inset-0 z-20 cursor-pointer" title="Clique para Comprar 1 Carta" />
                                        <span className="text-slate-500 text-[10px] font-bold uppercase z-10 text-center group-hover:text-indigo-400 transition-colors">Deck / Comprar</span>
                                        {myCards.filter(c => c.zone === 'deck').length > 0 && <div className="absolute inset-2 bg-indigo-900/40 rounded flex items-center justify-center border border-indigo-500/50 group-hover:bg-indigo-600/50 transition-colors"><span className="text-indigo-300 font-bold text-lg">{myCards.filter(c => c.zone === 'deck').length}</span></div>}

                                        {/* Shuffle Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); shuffleDeck(); }}
                                            title="Embaralhar"
                                            className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 bg-slate-800 text-slate-400 hover:text-white p-1 rounded transition-opacity"
                                        >
                                            <SearchIcon size={12} className="rotate-90" />
                                        </button>
                                    </DroppableZone>
                                    <DroppableZone id="discard" className="flex-1 bg-slate-900/60 rounded-xl border border-slate-700 p-2 relative flex flex-col items-center justify-center">
                                        <span className="text-slate-500 text-[10px] font-bold uppercase z-10">Descarte</span>
                                        {myCards.filter(c => c.zone === 'discard').length > 0 && (
                                            <div className="absolute inset-2 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                                                <span className="text-slate-400 font-bold text-lg">{myCards.filter(c => c.zone === 'discard').length}</span>
                                            </div>
                                        )}
                                    </DroppableZone>
                                </div>

                                {/* Inkwell Bottom */}
                                <DroppableZone id="inkwell" className="h-1/2 bg-slate-900/40 rounded-xl border border-slate-800 p-2 border-dashed relative flex flex-wrap gap-1 items-end overflow-hidden">
                                    <span className="absolute bottom-2 left-0 right-0 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest pointer-events-none">Reserva de Tinta</span>
                                    {myCards.filter(c => c.zone === 'inkwell').map(card => (
                                        <div key={card.uid} className="relative w-12 h-16 mt-2 -ml-6 first:ml-0 shadow-lg" style={{ transform: 'rotate(180deg)' }}>
                                            <Card card={card} />
                                        </div>
                                    ))}
                                </DroppableZone>
                            </div>

                            {/* Center: Hand */}
                            <DroppableZone id="hand" className="w-1/2 h-full bg-slate-900/60 rounded-t-3xl border-t border-x border-slate-700/50 flex flex-wrap items-center justify-center p-4 gap-2 relative shadow-[-10px_-10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                                {myCards.filter(c => c.zone === 'hand').length === 0 ? (
                                    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest absolute pointer-events-none">Sua Mão</span>
                                ) : (
                                    myCards.filter(c => c.zone === 'hand').map(card => (
                                        <div key={card.uid} className="relative group hover:-translate-y-4 transition-transform z-10">
                                            <Card card={card} />
                                        </div>
                                    ))
                                )}
                            </DroppableZone>

                            {/* Right side: Player Info & Lore Counter */}
                            <div className="w-1/4 h-full bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                                <h3 className="text-white font-bold text-xl mb-4 relative z-10">{playerName}</h3>

                                <div className="flex items-center gap-4 relative z-10">
                                    <button
                                        onClick={() => useStore.getState().updateLore(-1)}
                                        className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-red-400 font-bold text-xl hover:bg-slate-600 transition-colors border border-slate-600 shadow-md"
                                    >
                                        -
                                    </button>
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-orange-500 drop-shadow-sm filter">
                                            {players.find(p => p.name === playerName)?.lore || 0}
                                        </span>
                                        <span className="text-slate-400 text-sm font-bold tracking-[0.2em] uppercase mt-1">Lore</span>
                                    </div>
                                    <button
                                        onClick={() => useStore.getState().updateLore(1)}
                                        className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xl hover:bg-slate-600 transition-colors border border-slate-600 shadow-md"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </DndContext>

            {/* Modals */}
            {showGallery && <CardGallery onClose={() => setShowGallery(false)} />}
        </div>
    );
}
