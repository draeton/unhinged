import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableRowProps {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}

export const SortableRow: React.FC<SortableRowProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
    touchAction: 'none',
  };

  const dragHandle = (
    <button
      {...attributes}
      {...listeners}
      onPointerDown={e => {
        e.stopPropagation();
        listeners?.onPointerDown?.(e);
      }}
      aria-label="Drag to reorder"
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: isDragging ? 'grabbing' : 'grab',
        padding: '2px',
        touchAction: 'none',
      }}
    >
      <GripVertical size={18} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
};
