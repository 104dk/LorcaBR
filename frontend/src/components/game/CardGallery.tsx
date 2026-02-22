import React, { useState, useEffect } from 'react';
import { lorcanaApi, LorcanaCard } from '../../services/api';
import { useStore } from '../../store/useStore';
import { Search, Loader2, Plus, X } from 'lucide-react';

export default function CardGallery({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LorcanaCard[]>([]);
    const [loading, setLoading] = useState(false);
    const spawnCard = useStore(state => state.spawnCard);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            const cards = await lorcanaApi.searchCards(query);
            setResults(cards);
            setLoading(false);
        };

        const debounce = setTimeout(search, 500);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSpawn = (card: LorcanaCard) => {
        // We'll pass both URLs so the global toggle can choose between them
        const imageUrl = card.image_urls?.en || card.image_urls?.pt || '';
        const ptImageUrl = card.image_urls?.pt || null;

        if (!imageUrl && !ptImageUrl) {
            alert('Esta carta não possui imagem na API.');
            return;
        }
        spawnCard({
            id: card.id,
            name: card.name,
            imageUrl,
            ptImageUrl: ptImageUrl || undefined
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
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
                        placeholder="Buscar carta pelo nome (ex: Elsa)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                    {loading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400">
                            <Loader2 className="animate-spin mb-4" size={48} />
                            <p>Buscando no repositório Lorcana...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {results.map((card) => {
                                const img = card.image_urls?.pt || card.image_urls?.en;
                                if (!img) return null;
                                return (
                                    <div key={card.id} className="group relative bg-slate-800 rounded-xl rounded-b-md overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20">
                                        <img src={img} alt={card.name} className="w-full object-contain" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                            <button
                                                onClick={() => handleSpawn(card)}
                                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                                            >
                                                <Plus size={16} /> Adicionar
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : query ? (
                        <div className="text-center text-slate-500 mt-10">
                            Nenhuma carta encontrada com "{query}"
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 mt-10 empty-state-illustration">
                            Digite o nome de uma carta para buscar na API. <br />
                            Ela aparecerá no seu Playmat.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
