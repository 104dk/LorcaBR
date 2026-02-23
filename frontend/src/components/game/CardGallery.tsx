import React, { useState, useEffect } from 'react';
import { lorcanaApi, LorcanaCard } from '../../services/api';
import { useStore } from '../../store/useStore';
import { Search, Loader2, Plus, X, Zap, Wind, Shield, Users } from 'lucide-react';

const ABILITY_INFO: Record<string, { icon: string; color: string; label: string }> = {
    rush: { icon: '⚡', color: 'bg-yellow-500/80 text-yellow-100', label: 'Rush' },
    evasive: { icon: '💨', color: 'bg-sky-500/80 text-sky-100', label: 'Evasive' },
    ward: { icon: '🛡️', color: 'bg-blue-600/80 text-blue-100', label: 'Ward' },
    bodyguard: { icon: '🪖', color: 'bg-amber-600/80 text-amber-100', label: 'Bodyguard' },
    reckless: { icon: '💥', color: 'bg-red-600/80 text-red-100', label: 'Reckless' },
    challenger: { icon: '⚔️', color: 'bg-orange-600/80 text-orange-100', label: 'Challenger' },
    support: { icon: '🤝', color: 'bg-green-600/80 text-green-100', label: 'Support' },
};

export default function CardGallery({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LorcanaCard[]>([]);
    const [loading, setLoading] = useState(false);
    const spawnCard = useStore(state => state.spawnCard);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) { setResults([]); return; }
            setLoading(true);
            const cards = await lorcanaApi.searchCards(query);
            setResults(cards);
            setLoading(false);
        };
        const t = setTimeout(search, 400);
        return () => clearTimeout(t);
    }, [query]);

    const handleSpawn = (card: LorcanaCard) => {
        const imageUrl = card.image_urls?.en || card.image_urls?.pt || '';
        const ptImageUrl = card.image_urls?.pt || undefined;
        if (!imageUrl) { alert('Esta carta não possui imagem.'); return; }

        spawnCard({
            id: card.id,
            name: card.name,
            imageUrl,
            ptImageUrl,
            strength: card.strength,
            willpower: card.willpower,
            loreValue: card.lore,
            cost: card.cost,
            inkable: card.inkable,
            abilities: card.abilities ?? {},
            type: card.type,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Search size={20} className="text-indigo-400" />
                        Galeria de Cartas Lorcana
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-slate-800 bg-slate-950/30">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Buscar carta pelo nome (ex: Elsa, Mickey, Moana...)"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                    {loading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400">
                            <Loader2 className="animate-spin mb-4" size={48} />
                            <p>Buscando...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {results.map((card) => {
                                const img = card.image_urls?.en || card.image_urls?.pt;
                                if (!img) return null;
                                const abilityKeys = Object.keys(card.abilities || {}).filter(k => card.abilities[k as keyof typeof card.abilities]);
                                return (
                                    <div key={card.id} className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20 flex flex-col">
                                        {/* Card Image */}
                                        <div className="relative">
                                            <img src={img} alt={card.name} className="w-full object-contain" />
                                            {/* Inkable badge */}
                                            {card.inkable && (
                                                <div className="absolute top-1 left-1 bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">💧 INK</div>
                                            )}
                                        </div>
                                        {/* Stats bar */}
                                        {card.type === 'Character' && (
                                            <div className="flex justify-around px-2 py-1 bg-slate-900/80 text-[10px] font-bold border-t border-slate-700">
                                                <span className="text-red-400">⚔️ {card.strength}</span>
                                                <span className="text-blue-400">🛡️ {card.willpower}</span>
                                                <span className="text-amber-400">💎 {card.lore}</span>
                                                <span className="text-slate-400">💰 {card.cost}</span>
                                            </div>
                                        )}
                                        {/* Ability badges */}
                                        {abilityKeys.length > 0 && (
                                            <div className="flex flex-wrap gap-1 px-2 pb-1">
                                                {abilityKeys.map(k => {
                                                    const info = ABILITY_INFO[k];
                                                    if (!info) return null;
                                                    return (
                                                        <span key={k} className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${info.color}`}>
                                                            {info.icon} {info.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Hover overlay — Add button */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                                            <button
                                                onClick={() => handleSpawn(card)}
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all pointer-events-auto"
                                            >
                                                <Plus size={16} /> Adicionar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : query ? (
                        <div className="text-center text-slate-500 mt-10">Nenhuma carta encontrada com "{query}"</div>
                    ) : (
                        <div className="text-center text-slate-500 mt-10">
                            Digite o nome de uma carta para buscar. <br />
                            Ela aparecerá na sua mão.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
