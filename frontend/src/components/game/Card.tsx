import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GameCard, useStore } from '../../store/useStore';

interface CardProps {
    card: GameCard;
    onExert?: (uid: string) => void;
    onAddDamage?: (uid: string) => void;
    onRemoveDamage?: (uid: string) => void;
    isReadOnly?: boolean;
    isChallenger?: boolean;   // Highlighted as the active attacker
    isTarget?: boolean;       // Highlighted as valid challenge target
    onSelectChallenger?: (uid: string) => void;
    onSelectTarget?: (uid: string) => void;
    onShowPreview?: (card: any) => void;
}

const ABILITY_BADGES: Record<string, { label: string; color: string }> = {
    rush: { label: '⚡ Rush', color: 'bg-yellow-500 text-black' },
    evasive: { label: '💨 Evasive', color: 'bg-sky-500 text-white' },
    ward: { label: '🛡 Ward', color: 'bg-blue-600 text-white' },
    bodyguard: { label: '🪖 Bodyguard', color: 'bg-amber-600 text-white' },
    reckless: { label: '💥 Reckless', color: 'bg-red-600 text-white' },
    challenger: { label: '⚔️ Challenger', color: 'bg-orange-500 text-white' },
    support: { label: '🤝 Support', color: 'bg-green-600 text-white' },
};

export default function Card({
    card, onExert, onAddDamage, onRemoveDamage,
    isReadOnly, isChallenger, isTarget,
    onSelectChallenger, onSelectTarget, onShowPreview,
}: CardProps) {
    const isPtBr = useStore(s => s.isPtBr);

    const dnd = useDraggable({
        id: card.uid,
        data: { card },
        disabled: isReadOnly,
    });
    const { attributes, listeners, setNodeRef, transform } = dnd;

    const style = transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 }
        : undefined;

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isReadOnly && onExert) onExert(card.uid);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isReadOnly && onSelectTarget) { onSelectTarget(card.uid); return; }
        if (onSelectChallenger) { onSelectChallenger(card.uid); return; }

        // If not in challenge mode, show preview
        if (onShowPreview) {
            // Re-map GameCard to what PreviewModal expects
            onShowPreview({
                name: card.name,
                imageUrl: card.imageUrl,
                ptImageUrl: card.ptImageUrl,
                bodyText: (card as any).body_text || '', // We might need to ensure body_text is in GameCard
                strength: card.strength,
                willpower: card.willpower,
                loreValue: card.loreValue,
                type: card.type,
                color: (card as any).color || 'Unknown',
                abilities: card.abilities
            });
        }
    };

    const boardZones = ['ready', 'exerted', 'quest', 'items'];
    const showActions = !isReadOnly && boardZones.includes(card.zone);
    const abilityKeys = Object.keys(card.abilities || {}).filter(k => card.abilities[k as keyof typeof card.abilities]);

    // Border color logic
    const borderColor = isChallenger
        ? 'border-yellow-400 shadow-yellow-400/40'
        : isTarget
            ? 'border-red-500 shadow-red-500/40'
            : card.isExerted
                ? 'border-amber-500 shadow-amber-500/20'
                : card.isNew
                    ? 'border-slate-500 shadow-none opacity-70'
                    : 'border-slate-600';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative rounded-lg border-2 shadow-xl flex-shrink-0 transition-all flex flex-col group cursor-grab active:cursor-grabbing select-none
                ${isReadOnly ? 'w-16 h-24' : 'w-24 h-auto'}
                ${card.isExerted ? 'rotate-90 scale-95' : ''}
                ${!isReadOnly ? 'hover:-translate-y-2' : ''}
                ${borderColor} shadow-lg`}
            {...listeners}
            {...attributes}
            onDoubleClick={handleDoubleClick}
            onClick={handleClick}
        >
            {/* Card Image */}
            <div className="w-full relative overflow-hidden rounded-t-md">
                {card.imageUrl === '/card-back.jpg' ? (
                    <div className="w-full h-36 bg-slate-900 rounded-md border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent)]" />
                        <div className="w-12 h-16 border border-slate-800 rounded flex items-center justify-center bg-slate-950/50 shadow-inner z-10">
                            <span className="text-indigo-500 font-bold text-xs rotate-45 select-none">LORCANA</span>
                        </div>
                        <div className="mt-2 text-[8px] text-slate-600 font-bold tracking-[0.3em] uppercase z-10">Mesa Virtual</div>
                    </div>
                ) : (
                    <img
                        src={(isPtBr && card.ptImageUrl) ? card.ptImageUrl : card.imageUrl}
                        alt={card.name}
                        className="w-full object-cover rounded-t-md select-none pointer-events-none"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/card-back.jpg'; }}
                    />
                )}

                {/* isNew shimmer overlay */}
                {card.isNew && !isReadOnly && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center rounded-t-md">
                        <span className="text-slate-300 text-[9px] font-bold text-center px-1 leading-tight">Acabou de entrar</span>
                    </div>
                )}
            </div>

            {/* Stats Bar (Characters only, non-readonly) */}
            {!isReadOnly && card.type === 'Character' && (
                <div className="flex justify-around px-1 py-0.5 bg-slate-900/90 text-[9px] font-bold border-t border-slate-700">
                    <span className="text-red-400">⚔{card.strength}</span>
                    <span className={card.damage >= card.willpower && card.willpower > 0 ? 'text-red-300 animate-pulse' : 'text-blue-400'}>
                        🛡{card.willpower - card.damage}/{card.willpower}
                    </span>
                    <span className="text-amber-400">◆{card.loreValue}</span>
                </div>
            )}

            {/* Ability Badges */}
            {!isReadOnly && abilityKeys.length > 0 && (
                <div className="flex flex-wrap gap-0.5 px-1 pb-0.5 bg-slate-900/80">
                    {abilityKeys.slice(0, 3).map(k => {
                        const badge = ABILITY_BADGES[k];
                        if (!badge) return null;
                        return (
                            <span key={k} className={`text-[7px] px-1 py-0.5 rounded font-bold ${badge.color}`}>
                                {badge.label}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Damage counter */}
            {card.damage > 0 && (
                <div className="absolute top-1 right-1 w-7 h-7 bg-red-600/90 rounded-full border border-red-300 flex items-center justify-center z-10 shadow-lg">
                    <span className="text-white font-black text-xs">-{card.damage}</span>
                </div>
            )}

            {/* Quick action overlay (+/- damage) on hover in board zones */}
            {showActions && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded-lg p-1 flex gap-1 shadow-2xl z-20 pointer-events-none group-hover:pointer-events-auto">
                    <button
                        onPointerDown={e => { e.stopPropagation(); onRemoveDamage?.(card.uid); }}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-green-700 text-green-400 font-bold text-sm"
                        title="Remover Dano"
                    >+</button>
                    <button
                        onPointerDown={e => { e.stopPropagation(); onAddDamage?.(card.uid); }}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-red-700 text-red-400 font-bold text-sm"
                        title="Adicionar Dano"
                    >-</button>
                </div>
            )}

            {/* Challenge target pulse ring */}
            {isTarget && (
                <div className="absolute inset-0 rounded-lg border-4 border-red-500 animate-pulse pointer-events-none z-30" />
            )}
            {isChallenger && (
                <div className="absolute inset-0 rounded-lg border-4 border-yellow-400 animate-pulse pointer-events-none z-30" />
            )}
        </div>
    );
}
