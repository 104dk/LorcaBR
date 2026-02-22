import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableZoneProps {
    id: string; // 'hand', 'field', 'inkwell'
    className?: string;
    children: React.ReactNode;
}

export default function DroppableZone({ id, className, children }: DroppableZoneProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });

    const activeStyle = isOver ? 'bg-indigo-500/20 border-indigo-400/50 shadow-inner scale-[1.02] transition-all' : '';

    return (
        <div ref={setNodeRef} className={`${className} ${activeStyle}`}>
            {children}
        </div>
    );
}
