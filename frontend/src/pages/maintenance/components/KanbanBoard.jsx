import { useState } from 'react';
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { REQUEST_STAGES, STAGE_LABELS } from '../../../config/constants';

export function KanbanBoard({ groupedRequests, onStageChange, onRequestClick }) {
  const [activeId, setActiveId] = useState(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stages = Object.keys(REQUEST_STAGES);

  const findContainer = (id) => {
    if (stages.includes(id)) return id;
    
    for (const stage of stages) {
      if (groupedRequests[stage]?.find(r => r.id === id)) {
        return stage;
      }
    }
    return null;
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving to a different column
    onStageChange(active.id, overContainer);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (activeContainer !== overContainer) {
      onStageChange(active.id, overContainer);
    }

    setActiveId(null);
  };

  const activeRequest = activeId 
    ? Object.values(groupedRequests).flat().find(r => r.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            id={stage}
            title={STAGE_LABELS[stage]}
            requests={groupedRequests[stage] || []}
            onRequestClick={onRequestClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRequest ? (
          <KanbanCard request={activeRequest} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
