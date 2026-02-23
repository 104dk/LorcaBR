import React, { useState, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Play, Edit2, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { useDeckStore, SavedDeck } from '../../store/deckStore';
import DeckBuilder from './DeckBuilder';
import GameModeSelector from './GameModeSelector';

interface DeckManagerProps {
    onStartGame: (deckId: string, mode: string, team?: 'blue' | 'red') => void;
}

export default function DeckManager({ onStartGame }: DeckManagerProps) {
    const { decks, loadDecks, deleteDeck, exportDeck, importDeck, setActiveDeck } = useDeckStore();
    const [editingDeck, setEditingDeck] = useState<SavedDeck | null | 'new'>(null);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
    const [showModeSelector, setShowModeSelector] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load from localStorage on mount
    React.useEffect(() => { loadDecks(); }, [loadDecks]);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const json = ev.target?.result as string;
            const deck = importDeck(json);
            if (!deck) alert('Falha ao importar deck. Verifique se o arquivo é válido.');
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleSelectDeck = (deckId: string) => {
        setSelectedDeckId(deckId);
        setActiveDeck(deckId);
    };

    const handlePlay = () => {
        if (!selectedDeckId) return;
        setShowModeSelector(true);
    };

    if (showModeSelector && selectedDeckId) {
        return (
            <GameModeSelector
                deckId={selectedDeckId}
                onBack={() => setShowModeSelector(false)}
                onStart={onStartGame}
            />
        );
    }

    if (editingDeck !== null) {
        return (
            <DeckBuilder
                existingDeck={editingDeck === 'new' ? null : editingDeck}
                onClose={() => setEditingDeck(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.8),rgba(2,6,23,1))] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-amber-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                        LorcanaBR
                    </h1>
                    <p className="text-slate-400 text-lg">Selecione ou crie um deck para jogar</p>
                </div>

                {/* Deck Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {decks.map(deck => {
                        const isSelected = selectedDeckId === deck.id;
                        const total = deck.cards.reduce((s, c) => s + c.count, 0);
                        const isValid = total >= 60;
                        return (
                            <div
                                key={deck.id}
                                onClick={() => handleSelectDeck(deck.id)}
                                className={`group relative bg-slate-800 rounded-2xl border-2 p-5 cursor-pointer transition-all shadow-xl ${isSelected ? 'border-indigo-500 shadow-indigo-500/30 bg-slate-700' : 'border-slate-700 hover:border-slate-600'}`}
                            >
                                {/* Selection ring */}
                                {isSelected && <div className="absolute -top-px -left-px -right-px -bottom-px rounded-2xl border-2 border-indigo-500 animate-pulse pointer-events-none" />}

                                <div className="flex justify-between items-start mb-3">
                                    <BookOpen className="text-indigo-400" size={24} />
                                    <div className="flex gap-1">
                                        <button onClick={e => { e.stopPropagation(); setEditingDeck(deck); }} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); exportDeck(deck.id); }} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-green-400 transition-colors" title="Exportar">
                                            <Download size={14} />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); if (confirm(`Apagar "${deck.name}"?`)) deleteDeck(deck.id); }} className="p-1.5 bg-slate-700 hover:bg-red-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1 truncate">{deck.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${isValid ? 'text-green-400' : 'text-amber-400'}`}>
                                        {total} cartas
                                    </span>
                                    {!isValid && <AlertCircle size={14} className="text-amber-400" />}
                                    {isValid && <span className="text-green-400 text-xs">✓ Válido</span>}
                                </div>
                                <p className="text-slate-600 text-xs mt-2">{new Date(deck.createdAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                        );
                    })}

                    {/* New Deck Slot */}
                    {decks.length < 3 && (
                        <button
                            onClick={() => setEditingDeck('new')}
                            className="group bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 p-5 flex flex-col items-center justify-center gap-3 transition-all hover:bg-slate-800/50 min-h-[140px]"
                        >
                            <Plus size={32} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-slate-500 group-hover:text-slate-300 font-medium transition-colors">Criar Novo Deck</span>
                            <span className="text-slate-700 text-xs">{3 - decks.length} slot(s) disponíveis</span>
                        </button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 cursor-pointer transition-all font-medium">
                        <Upload size={18} />
                        Importar Deck
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>

                    <button
                        onClick={handlePlay}
                        disabled={!selectedDeckId}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-lg transition-all ${selectedDeckId ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                    >
                        <Play size={20} />
                        Jogar
                        {selectedDeckId && <ChevronRight size={18} />}
                    </button>
                </div>

                {!selectedDeckId && decks.length > 0 && (
                    <p className="text-center text-slate-600 text-sm mt-3">Selecione um deck acima para continuar</p>
                )}
            </div>
        </div>
    );
}
