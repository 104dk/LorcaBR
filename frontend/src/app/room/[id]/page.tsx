"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useStore } from '../../../store/useStore';
import { Users, LogOut, Search as SearchIcon, Globe, Sword, Zap, Droplets, Crown } from 'lucide-react';
import CardGallery from '../../../components/game/CardGallery';
import Card from '../../../components/game/Card';
import DroppableZone from '../../../components/game/DroppableZone';
import CardPreviewModal from '../../../components/game/CardPreviewModal';

export default function GameRoom() {
    const params = useParams();
    const roomId = params.id as string;
    const router = useRouter();
    const [showGallery, setShowGallery] = useState(false);
    const [previewCard, setPreviewCard] = useState<any | null>(null);

    const {
        players, connected, joinRoom, playerName,
        myCards, moveCard, toggleExert, addDamage, removeDamage,
        isPtBr, toggleLanguage, drawCard, shuffleDeck, opponentCards,
        isMyTurn, hasInkedThisTurn, endTurn, inkCard, questCard,
        challengerUid, setChallengerUid, challengeCard,
        gameOver, dismissGameOver, gameMode, myTeam,
    } = useStore();

    // --- Drag & Drop ---
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id) {
            moveCard(active.id as string, over.id as any);
        }
    };

    useEffect(() => {
        if (!playerName) { router.push('/'); return; }
        joinRoom(roomId).then(success => {
            if (success) {
                // Try to load deck if deckId is in URL
                const searchParams = new URLSearchParams(window.location.search);
                const deckId = searchParams.get('deckId');
                if (deckId) {
                    const deck = JSON.parse(localStorage.getItem('lorcana_decks') || '[]').find((d: any) => d.id === deckId);
                    if (deck) {
                        useStore.getState().spawnDeck(deck.cards);
                        // Optional: draw initial hand
                        for (let i = 0; i < 7; i++) {
                            useStore.getState().drawCard();
                        }
                    }
                }
            }
        });
    }, [roomId, playerName, joinRoom, router]);

    // --- Challenge mode: click a ready card to select attacker ---
    const handleSelectChallenger = useCallback((uid: string) => {
        if (!isMyTurn) return;
        const card = myCards.find(c => c.uid === uid);
        if (!card || card.isNew && !card.abilities.rush) return;
        setChallengerUid(challengerUid === uid ? null : uid);
    }, [myCards, challengerUid, isMyTurn, setChallengerUid]);

    // --- Challenge mode: click an exerted opponent card to resolve challenge ---
    const handleSelectTarget = useCallback((uid: string) => {
        if (!challengerUid) return;
        challengeCard(uid);
    }, [challengerUid, challengeCard]);

    if (!connected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <p className="animate-pulse text-indigo-400">Conectando ao servidor...</p>
            </div>
        );
    }

    const myPlayer = players.find(p => p.name === playerName);
    const myLore = myPlayer?.lore ?? 0;
    const deckCount = myCards.filter(c => c.zone === 'deck').length;
    const handCount = myCards.filter(c => c.zone === 'hand').length;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">

            {/* ─── Victory / Defeat Modal ─── */}
            {gameOver && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md">
                    <div className={`rounded-2xl border shadow-2xl p-10 flex flex-col items-center gap-6 ${gameOver === 'win' ? 'bg-amber-900/30 border-amber-500' : 'bg-slate-900 border-red-700'}`}>
                        <Crown size={64} className={gameOver === 'win' ? 'text-amber-400 animate-bounce' : 'text-red-500'} />
                        <h2 className="text-5xl font-black text-white tracking-wide">
                            {gameOver === 'win' ? '🏆 Vitória!' : '💀 Derrota!'}
                        </h2>
                        <p className="text-slate-400 text-lg text-center">
                            {gameOver === 'win' ? 'Você alcançou 20 de Lore!' : 'Seu deck acabou ao tentar comprar.'}
                        </p>
                        <div className="flex gap-4">
                            <button onClick={dismissGameOver} className="px-8 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors">
                                Continuar
                            </button>
                            <button onClick={() => router.push('/')} className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors">
                                Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Top Navigation Bar ─── */}
            <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex justify-between items-center shadow-lg z-50">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">LorcanaBR</h1>
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-sm">
                        <span className="text-slate-400">Sala:</span>
                        <span className="text-white font-mono font-bold tracking-widest">{roomId}</span>
                    </div>
                    {/* Turn indicator */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${isMyTurn ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                        {isMyTurn ? 'Seu Turno' : 'Turno do Oponente'}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleLanguage} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${isPtBr ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'}`}>
                        <Globe size={16} />
                        {isPtBr ? 'PT-BR' : 'EN'}
                    </button>

                    <button onClick={() => setShowGallery(true)} className="flex items-center gap-1.5 text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 border border-indigo-500/30 text-sm font-semibold transition-colors">
                        <SearchIcon size={16} />
                        Adicionar Carta
                    </button>

                    {/* Challenge mode button */}
                    <button
                        onClick={() => setChallengerUid(null)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border ${challengerUid ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 animate-pulse' : 'bg-slate-800/50 text-slate-500 border-slate-700'}`}
                    >
                        <Sword size={16} />
                        {challengerUid ? 'Cancelar Desafio' : 'Modo Desafio'}
                    </button>

                    <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                        <Users size={16} className="text-indigo-400" />
                        <span>{players.length}/4</span>
                    </div>

                    {/* End Turn Button */}
                    <button
                        onClick={endTurn}
                        disabled={!isMyTurn}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${isMyTurn ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30 shadow-md' : 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'}`}
                    >
                        ⟳ Fim de Turno
                    </button>

                    <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1.5 rounded-md hover:bg-red-400/20 text-sm transition-colors">
                        <LogOut size={15} />
                        Sair
                    </button>
                </div>
            </header>

            {/* ─── Main Game Area ─── */}
            <DndContext onDragEnd={handleDragEnd}>
                <main className="flex-grow flex relative overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.5),rgba(2,6,23,1))]">
                    <div className="w-full h-full p-4 flex flex-col gap-4">

                        {/* Opponents Area (Top) */}
                        <div className="h-36 flex justify-center items-stretch gap-4 px-4 py-2 border border-slate-800/50 rounded-2xl bg-slate-900/20 overflow-x-auto">
                            {players.filter(p => p.name !== playerName).map((opponent) => {
                                const oCards = opponentCards[opponent.id] || [];
                                const hasBoard = oCards.some(c => ['ready', 'exerted', 'quest', 'items'].includes(c.zone));
                                const isPartner = gameMode === '2v2' && opponent.team === myTeam;

                                return (
                                    <div key={opponent.id} className={`min-w-[280px] flex backdrop-blur-sm rounded-xl border p-2 shadow-xl relative overflow-hidden transition-all ${isPartner ? 'bg-indigo-900/40 border-indigo-500/50 ring-1 ring-indigo-500/20' : 'bg-slate-800/60 border-slate-700'}`}>
                                        {/* Team Badge */}
                                        {gameMode === '2v2' && (
                                            <div className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter rounded-bl-lg border-l border-b ${isPartner ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-red-500 text-white border-red-400'}`}>
                                                {isPartner ? 'Parceiro' : 'Oponente'}
                                            </div>
                                        )}

                                        {/* Opponent info */}
                                        <div className="w-20 flex flex-col items-center justify-center border-r border-slate-700 pr-2 mr-2 flex-shrink-0">
                                            <h3 className={`font-bold text-xs mb-1 truncate w-full text-center ${isPartner ? 'text-indigo-200' : 'text-slate-200'}`}>{opponent.name}</h3>
                                            <span className={`font-black text-2xl ${isPartner ? 'text-indigo-400' : 'text-amber-400'}`}>{opponent.lore}</span>
                                            <span className="text-slate-500 text-[8px] uppercase font-bold">Lore</span>
                                            <div className="mt-1 flex gap-2 text-[9px]">
                                                <span className="text-slate-400">✋ {oCards.filter(c => c.zone === 'hand').length}</span>
                                                <span className={`${isPartner ? 'text-indigo-400' : 'text-indigo-400'}`}>💧 {oCards.filter(c => c.zone === 'inkwell').length}</span>
                                            </div>
                                        </div>
                                        {/* Opponent field */}
                                        <div className="flex-1 flex flex-wrap gap-0.5 content-start overflow-hidden">
                                            {oCards.filter(c => ['ready', 'exerted', 'quest', 'items'].includes(c.zone)).map(card => (
                                                <div key={card.uid} className="scale-[0.45] origin-top-left -mr-10 -mb-14">
                                                    <Card
                                                        card={card}
                                                        isReadOnly
                                                        isTarget={!!challengerUid && card.isExerted && !isPartner}
                                                        onSelectTarget={handleSelectTarget}
                                                        onShowPreview={setPreviewCard}
                                                    />
                                                </div>
                                            ))}
                                            {!hasBoard && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-slate-600 text-[10px] uppercase tracking-widest opacity-30">Campo Vazio</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {players.length === 1 && (
                                <div className="text-slate-500 font-medium italic flex items-center justify-center w-full h-full text-sm">
                                    Aguardando oponentes entrarem na sala...
                                </div>
                            )}
                        </div>

                        {/* Central Field (True Lorcana Playmat) */}
                        <div className="flex-[2] flex gap-3 w-full min-h-0">
                            {/* Left Column: Deck & Discard */}
                            <div className="w-40 flex flex-col gap-3">
                                <DroppableZone id="deck" className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div onClick={drawCard} className="absolute inset-0 z-20 cursor-pointer" title="Clique para Comprar" />
                                    <span className="text-slate-500 font-bold text-lg uppercase tracking-widest select-none opacity-30">Deck</span>
                                    {deckCount > 0 && (
                                        <div className="absolute inset-3 bg-indigo-900/40 rounded flex items-center justify-center border border-indigo-500/50 group-hover:bg-indigo-600/50 transition-colors">
                                            <span className="text-indigo-300 font-bold text-2xl">{deckCount}</span>
                                        </div>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); shuffleDeck(); }} title="Embaralhar" className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded transition-opacity">
                                        <SearchIcon size={14} className="rotate-90" />
                                    </button>
                                </DroppableZone>

                                <DroppableZone id="discard" className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/40 flex flex-col items-center justify-center relative overflow-hidden">
                                    <span className="text-slate-500 font-bold text-lg uppercase tracking-widest select-none opacity-30">Discard</span>
                                    {myCards.filter(c => c.zone === 'discard').length > 0 && (
                                        <>
                                            <div className="absolute inset-4 overflow-hidden rounded pointer-events-none opacity-70">
                                                <Card card={myCards.filter(c => c.zone === 'discard').at(-1)!} isReadOnly onShowPreview={setPreviewCard} />
                                            </div>
                                            <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-xs text-slate-400 z-10 border border-slate-800">
                                                {myCards.filter(c => c.zone === 'discard').length}
                                            </div>
                                        </>
                                    )}
                                </DroppableZone>
                            </div>

                            {/* Center: Ready / Exerted / Quest / Inkwell */}
                            <div className="flex-1 flex flex-col gap-1 min-h-0">
                                <DroppableZone id="ready" className="flex-1 border-b border-dashed border-slate-700/30 bg-slate-800/10 flex items-center flex-wrap gap-3 p-3 relative">
                                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-slate-600/20 font-black text-2xl uppercase tracking-widest select-none pointer-events-none">Ready</span>
                                    {myCards.filter(c => c.zone === 'ready').map(card => (
                                        <Card
                                            key={card.uid} card={card}
                                            onExert={toggleExert} onAddDamage={addDamage} onRemoveDamage={removeDamage}
                                            isChallenger={challengerUid === card.uid}
                                            onSelectChallenger={handleSelectChallenger}
                                            onShowPreview={setPreviewCard}
                                        />
                                    ))}
                                </DroppableZone>

                                <DroppableZone id="exerted" className="flex-1 border-b border-dashed border-slate-700/30 bg-slate-800/10 flex items-center flex-wrap gap-3 p-3 relative">
                                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-slate-600/20 font-black text-2xl uppercase tracking-widest select-none pointer-events-none">Exerted</span>
                                    {myCards.filter(c => c.zone === 'exerted').map(card => (
                                        <Card
                                            key={card.uid} card={card}
                                            onExert={toggleExert} onAddDamage={addDamage} onRemoveDamage={removeDamage}
                                            isChallenger={challengerUid === card.uid}
                                            onSelectChallenger={handleSelectChallenger}
                                            onShowPreview={setPreviewCard}
                                        />
                                    ))}
                                </DroppableZone>

                                <DroppableZone id="quest" className="h-20 border-b border-dashed border-indigo-900/40 bg-indigo-900/10 flex items-center flex-wrap gap-2 px-3 relative">
                                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-indigo-600/20 font-black text-xl uppercase tracking-widest select-none pointer-events-none">Quest ▶</span>
                                    {myCards.filter(c => c.zone === 'quest').map(card => (
                                        <Card key={card.uid} card={card} onExert={toggleExert} onAddDamage={addDamage} onRemoveDamage={removeDamage} onShowPreview={setPreviewCard} />
                                    ))}
                                </DroppableZone>

                                <DroppableZone id="inkwell" className="h-24 bg-slate-900/40 border border-slate-800 border-dashed relative flex flex-wrap gap-2 items-center px-3 overflow-hidden justify-center">
                                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500/8 text-4xl font-black uppercase tracking-[0.5em] pointer-events-none z-0">Inkwell</span>
                                    {myCards.filter(c => c.zone === 'inkwell').map(card => (
                                        <div key={card.uid} className="relative w-14 h-20 z-10 flex-shrink-0" style={{ transform: 'rotate(180deg)' }}>
                                            <Card card={card} onShowPreview={setPreviewCard} />
                                        </div>
                                    ))}
                                </DroppableZone>
                            </div>

                            {/* Right Column: Items */}
                            <div className="w-40 flex flex-col">
                                <DroppableZone id="items" className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/20 flex flex-col items-center p-3 gap-3 relative">
                                    <span className="text-slate-500 font-bold text-lg uppercase tracking-widest opacity-30 select-none">Items</span>
                                    {myCards.filter(c => c.zone === 'items').map(card => (
                                        <Card key={card.uid} card={card} onExert={toggleExert} onAddDamage={addDamage} onRemoveDamage={removeDamage} onShowPreview={setPreviewCard} />
                                    ))}
                                </DroppableZone>
                            </div>
                        </div>

                        {/* Hand & Player Info (Bottom) */}
                        <div className="flex-none flex gap-4 h-36 items-end">
                            {/* Hand */}
                            <DroppableZone id="hand" className="flex-1 h-full bg-slate-900/60 rounded-2xl border border-slate-700/50 flex flex-wrap items-center justify-center p-3 gap-2 relative overflow-hidden shadow-inner">
                                {myCards.filter(c => c.zone === 'hand').length === 0
                                    ? <span className="text-slate-600 text-sm font-bold uppercase tracking-widest">Sua Mão</span>
                                    : myCards.filter(c => c.zone === 'hand').map(card => (
                                        <div key={card.uid} className="relative group hover:-translate-y-3 transition-transform z-10">
                                            {/* Ink button on hand cards */}
                                            {card.inkable && !hasInkedThisTurn && isMyTurn && (
                                                <button
                                                    onPointerDown={e => { e.stopPropagation(); inkCard(card.uid); }}
                                                    className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 z-30 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow transition-opacity whitespace-nowrap"
                                                    title="Entintar"
                                                >
                                                    💧 Entintar
                                                </button>
                                            )}
                                            {/* Quest button on hand cards dragged to ready */}
                                            <Card card={card} onShowPreview={setPreviewCard} />
                                        </div>
                                    ))
                                }
                            </DroppableZone>

                            {/* Player Info & Lore */}
                            <div className="w-44 h-full bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-3xl -mr-14 -mt-14" />
                                <h3 className="text-white font-bold text-base mb-3 relative z-10 truncate w-full text-center">{playerName}</h3>
                                <div className="flex items-center gap-3 relative z-10">
                                    <button onClick={() => useStore.getState().updateLore(-1)} className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-red-400 font-bold text-lg hover:bg-slate-600 transition-colors border border-slate-600">-</button>
                                    <div className="flex flex-col items-center min-w-[56px]">
                                        <span className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br ${myLore >= 20 ? 'from-amber-300 to-amber-500 animate-pulse' : 'from-amber-300 to-orange-500'}`}>
                                            {myLore}
                                        </span>
                                        <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">/ 20 Lore</span>
                                    </div>
                                    <button onClick={() => useStore.getState().updateLore(1)} className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center text-emerald-400 font-bold text-lg hover:bg-slate-600 transition-colors border border-slate-600">+</button>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-500 flex gap-3 z-10">
                                    <span>✋ {handCount}</span>
                                    <span>📚 {deckCount}</span>
                                    {hasInkedThisTurn && <span className="text-amber-600">💧 Ink✓</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </DndContext>

            {showGallery && <CardGallery onClose={() => setShowGallery(false)} />}
            {previewCard && <CardPreviewModal card={previewCard} onClose={() => setPreviewCard(null)} />}
        </div>
    );
}
