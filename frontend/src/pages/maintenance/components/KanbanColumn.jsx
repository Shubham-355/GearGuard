import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';

const stageColors = {
  NEW: 'border-t-blue-500',
  IN_PROGRESS: 'border-t-yellow-500',
  REPAIRED: 'border-t-green-500',
  SCRAP: 'border-t-gray-500',
};

export function KanbanColumn({ id, title, requests, onRequestClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-80 bg-gray-50 rounded-xl border-t-4 ${stageColors[id]}
        ${isOver ? 'bg-blue-50' : ''}
      `}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {requests.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <SortableContext items={requests.map(r => r.id)} strategy={verticalListSortingStrategy}>
          {requests.map((request) => (
            <KanbanCard 
              key={request.id} 
              request={request} 
              onClick={() => onRequestClick(request.id)}
            />
          ))}
        </SortableContext>
        
        {requests.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No requests
          </div>
        )}
      </div>
    </div>
  );
}
