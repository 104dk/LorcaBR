import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GameCard, useStore } from '../../store/useStore';

interface CardProps {
    card: GameCard;
    onExert?: (uid: string) => void;
    onAddDamage?: (uid: string) => void;
    onRemoveDamage?: (uid: string) => void;
}

export default function Card({ card, onExert, onAddDamage, onRemoveDamage }: CardProps) {
    const isPtBr = useStore(state => state.isPtBr);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: card.uid,
        data: { card },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) relative`,
        zIndex: 999,
    } : undefined;

    // Double click to exert
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onExert) onExert(card.uid);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onDoubleClick={handleDoubleClick}
            className={`relative w-24 h-36 bg-slate-800 rounded-lg border-2 shadow-xl flex-shrink-0 cursor-grab active:cursor-grabbing transition-transform flex flex-col items-center justify-center group ${card.isExerted ? 'rotate-90 scale-95 border-amber-500 shadow-amber-500/20' : 'border-slate-600 hover:-translate-y-2'
                }`}
        >
            <img
                src={(isPtBr && card.ptImageUrl) ? card.ptImageUrl : card.imageUrl}
                alt={card.name}
                className="w-full h-full object-cover rounded-md select-none pointer-events-none"
            />

            {/* Damage Counters Float */}
            {card.damage > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-600/90 backdrop-blur-sm rounded-full border-2 border-red-300 shadow-lg flex items-center justify-center z-10">
                    <span className="text-white font-black text-xl drop-shadow-md">-{card.damage}</span>
                </div>
            )}

            {/* Quick Action Overlay (Visible on Hover in Field) */}
            {card.zone === 'field' && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded-lg p-1 flex gap-1 shadow-2xl z-20">
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); if (onRemoveDamage) onRemoveDamage(card.uid); }}
                        className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-green-400 font-bold"
                    >
                        +
                    </button>
                    <button
                        onPointerDown={(e) => { e.stopPropagation(); if (onAddDamage) onAddDamage(card.uid); }}
                        className="w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-red-400 font-bold"
                    >
                        -
                    </button>
                </div>
            )}
        </div>
    );
}
