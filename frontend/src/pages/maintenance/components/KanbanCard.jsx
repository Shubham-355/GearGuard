import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Clock, AlertCircle, Wrench, Calendar } from 'lucide-react';
import { Avatar, Badge } from '../../../components/ui';
import { PRIORITY_COLORS, REQUEST_TYPE_LABELS } from '../../../config/constants';

export function KanbanCard({ request, onClick, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityDiamonds = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 p-4 cursor-pointer
        hover:shadow-md transition-shadow
        ${isDragging || isSortableDragging ? 'shadow-lg opacity-90' : ''}
        ${request.isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}
    >
      {/* Overdue indicator */}
      {request.isOverdue && (
        <div className="flex items-center gap-1 text-red-600 text-xs font-medium mb-2">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </div>
      )}

      {/* Subject */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{request.subject}</h4>

      {/* Equipment */}
      {request.equipment && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Wrench className="w-4 h-4" />
          <span className="truncate">{request.equipment.name}</span>
        </div>
      )}

      {/* Request Type Badge */}
      <div className="mb-3">
        <Badge 
          variant={request.requestType === 'CORRECTIVE' ? 'danger' : 'info'}
          size="sm"
        >
          {request.requestType === 'CORRECTIVE' ? 'Corrective' : 'Preventive'}
        </Badge>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Priority diamonds */}
        <div className="flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <span
              key={i}
              className={`text-sm ${i < priorityDiamonds[request.priority] ? PRIORITY_COLORS[request.priority] : 'text-gray-300'}`}
            >
              ◆
            </span>
          ))}
        </div>

        {/* Technician Avatar */}
        {request.technician ? (
          <Avatar 
            name={request.technician.name} 
            src={request.technician.avatar}
            size="xs" 
          />
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        )}
      </div>

      {/* Scheduled Date */}
      {request.scheduledDate && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <Calendar className="w-3 h-3" />
          {format(new Date(request.scheduledDate), 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
}
