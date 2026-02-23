import React, { useState, useEffect } from 'react';
import { X, Languages, Loader2, Sword, Shield, Sparkles } from 'lucide-react';
import { translateApi } from '../../services/translateApi';

interface CardPreviewModalProps {
    card: {
        name: string;
        imageUrl: string;
        ptImageUrl: string | null;
        bodyText: string;
        strength: number;
        willpower: number;
        loreValue: number;
        type: string;
        color: string;
        abilities: any;
    };
    onClose: () => void;
}

export default function CardPreviewModal({ card, onClose }: CardPreviewModalProps) {
    const [translatedText, setTranslatedText] = useState<string>('');
    const [translatedName, setTranslatedName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchTranslation() {
            if (!card.bodyText && !card.name) return;
            setLoading(true);
            try {
                const [tName, tText] = await Promise.all([
                    translateApi.translateToPtBr(card.name),
                    card.bodyText ? translateApi.translateToPtBr(card.bodyText) : Promise.resolve('')
                ]);
                setTranslatedName(tName);
                setTranslatedText(tText);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchTranslation();

        // Close on ESC
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [card]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-slate-800 hover:bg-red-600 text-white rounded-full transition-all"
                >
                    <X size={24} />
                </button>

                {/* Left Side: Card Image */}
                <div className="w-full md:w-1/2 p-6 bg-slate-950/50 flex items-center justify-center">
                    <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full max-w-[320px] rounded-[1.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                    />
                </div>

                {/* Right Side: Translation & Info */}
                <div className="w-full md:w-1/2 p-8 flex flex-col h-full overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{card.type} · {card.color}</span>
                    </div>

                    <h2 className="text-3xl font-black text-white mb-1 tracking-tight">
                        {translatedName || card.name}
                    </h2>
                    {translatedName && translatedName !== card.name && (
                        <p className="text-slate-500 font-medium text-sm mb-6 flex items-center gap-1.5 italic">
                            <Languages size={14} /> {card.name}
                        </p>
                    )}

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6 min-h-[160px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-2">
                            <span className="text-amber-400 font-bold text-xs uppercase">Tradução PT-BR</span>
                            {loading && <Loader2 size={16} className="text-indigo-400 animate-spin" />}
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center italic text-slate-500">
                                Traduzindo textos da carta...
                            </div>
                        ) : error ? (
                            <div className="flex-1 flex items-center justify-center text-red-400/80 italic">
                                Erro ao carregar tradução.
                            </div>
                        ) : (
                            <div className="text-slate-200 leading-relaxed text-lg whitespace-pre-wrap">
                                {translatedText || "Sem texto de efeito."}
                            </div>
                        )}
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-3 gap-4 mt-auto">
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                            <Sword size={20} className="text-red-400 mb-1" />
                            <span className="text-2xl font-black text-white">{card.strength}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Ataque</span>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                            <Shield size={20} className="text-blue-400 mb-1" />
                            <span className="text-2xl font-black text-white">{card.willpower}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Defesa</span>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center">
                            <div className="text-amber-400 mb-1 flex gap-0.5">
                                {[...Array(Math.max(1, card.loreValue))].map((_, i) => (
                                    <span key={i} className="text-lg">◆</span>
                                ))}
                            </div>
                            <span className="text-2xl font-black text-white">{card.loreValue}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Lore</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
