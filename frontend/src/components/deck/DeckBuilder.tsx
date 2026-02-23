import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Minus, Save, X, AlertCircle } from 'lucide-react';
import { lorcanaApi, LorcanaCard } from '../../services/api';
import { useDeckStore, DeckCard, SavedDeck } from '../../store/deckStore';

interface DeckBuilderProps {
    existingDeck: SavedDeck | null;
    onClose: () => void;
}

export default function DeckBuilder({ existingDeck, onClose }: DeckBuilderProps) {
    const { saveDeck, updateDeck } = useDeckStore();
    const [deckName, setDeckName] = useState(existingDeck?.name || 'Meu Deck');
    const [cards, setCards] = useState<DeckCard[]>(existingDeck?.cards || []);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LorcanaCard[]>([]);
    const [loading, setLoading] = useState(false);

    const totalCards = cards.reduce((sum, c) => sum + c.count, 0);
    const isValid = totalCards >= 60;

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            const found = await lorcanaApi.searchCards(query);
            setResults(found);
            setLoading(false);
        }, 400);
        return () => clearTimeout(t);
    }, [query]);

    const addCard = (card: LorcanaCard) => {
        setCards(prev => {
            const existing = prev.find(c => c.cardId === card.id);
            if (existing) {
                if (existing.count >= 4) return prev; // max 4 copies
                return prev.map(c => c.cardId === card.id ? { ...c, count: c.count + 1 } : c);
            }
            const newCard: DeckCard = {
                cardId: card.id,
                name: card.name,
                imageUrl: card.image_urls?.en || '',
                cost: card.cost,
                type: card.type,
                color: card.color,
                strength: card.strength,
                willpower: card.willpower,
                loreValue: card.lore,
                inkable: card.inkable,
                count: 1,
            };
            return [...prev, newCard];
        });
    };

    const removeCard = (cardId: string) => {
        setCards(prev => {
            const existing = prev.find(c => c.cardId === cardId);
            if (!existing) return prev;
            if (existing.count === 1) return prev.filter(c => c.cardId !== cardId);
            return prev.map(c => c.cardId === cardId ? { ...c, count: c.count - 1 } : c);
        });
    };

    const handleSave = () => {
        if (!deckName.trim()) return;
        if (existingDeck) {
            updateDeck(existingDeck.id, { name: deckName, cards });
        } else {
            saveDeck({ name: deckName, cards });
        }
        onClose();
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4">
                <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} /> Voltar
                </button>

                <input
                    value={deckName}
                    onChange={e => setDeckName(e.target.value)}
                    className="flex-1 max-w-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Nome do Deck"
                />

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${isValid ? 'text-green-400' : 'text-amber-400'}`}>
                        {!isValid && <AlertCircle size={16} />}
                        {totalCards} / 60+ cartas
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors shadow-lg"
                    >
                        <Save size={16} /> Salvar Deck
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Card Search */}
                <div className="w-1/2 flex flex-col border-r border-slate-800">
                    <div className="p-3 border-b border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar cartas (ex: Elsa, Mickey...)"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                autoFocus
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 content-start">
                        {results.map(card => {
                            const img = card.image_urls?.en || card.image_urls?.pt;
                            const inDeck = cards.find(c => c.cardId === card.id);
                            if (!img) return null;
                            return (
                                <div key={card.id} className="relative group bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all">
                                    <img src={img} alt={card.name} className="w-full object-contain" />
                                    <div className="p-1.5">
                                        <p className="text-white text-[10px] font-bold truncate">{card.name}</p>
                                        <div className="flex justify-between text-[9px] text-slate-400">
                                            <span>💰{card.cost}</span>
                                            <span>⚔{card.strength}</span>
                                            <span>🛡{card.willpower}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addCard(card)}
                                        disabled={(inDeck?.count ?? 0) >= 4}
                                        className="absolute inset-0 bg-indigo-600/0 hover:bg-indigo-600/80 transition-all flex items-center justify-center opacity-0 hover:opacity-100"
                                    >
                                        <Plus size={32} className="text-white" />
                                        {inDeck && <span className="absolute top-2 right-2 bg-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{inDeck.count}</span>}
                                    </button>
                                </div>
                            );
                        })}
                        {!results.length && !loading && query && (
                            <p className="text-slate-500 col-span-3 text-center text-sm mt-4">Nenhuma carta encontrada</p>
                        )}
                        {!query && (
                            <p className="text-slate-500 col-span-3 text-center text-sm mt-4">Digite para buscar cartas</p>
                        )}
                    </div>
                </div>

                {/* Right: Deck List */}
                <div className="w-1/2 flex flex-col">
                    <div className="p-3 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Deck — {cards.length} cartas únicas
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {cards.length === 0 && (
                            <p className="text-slate-600 text-center text-sm mt-10">Adicione cartas da busca ao deck</p>
                        )}
                        {cards.sort((a, b) => a.cost - b.cost).map(card => (
                            <div key={card.cardId} className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2 hover:bg-slate-700 transition-colors group">
                                <span className="text-amber-400 font-bold text-sm w-6 text-center">{card.count}x</span>
                                <img src={card.imageUrl} alt={card.name} className="w-8 h-10 object-cover rounded" onError={e => { (e.target as any).style.display = 'none'; }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{card.name}</p>
                                    <p className="text-slate-500 text-xs">💰{card.cost} · {card.type}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeCard(card.cardId)} className="p-1 bg-slate-700 hover:bg-red-700 rounded text-slate-400 hover:text-white"><Minus size={12} /></button>
                                    <button onClick={() => addCard({ id: card.cardId, name: card.name, image_urls: { en: card.imageUrl }, cost: card.cost, type: card.type, color: card.color, strength: card.strength, willpower: card.willpower, lore: card.loreValue, inkable: card.inkable, abilities: {}, body_text: '', title: '' })} className="p-1 bg-slate-700 hover:bg-indigo-600 rounded text-slate-400 hover:text-white"><Plus size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
