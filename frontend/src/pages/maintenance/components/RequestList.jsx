import { format } from 'date-fns';
import { Card, Badge, Avatar } from '../../../components/ui';
import { STAGE_LABELS, STAGE_COLORS, PRIORITY_COLORS } from '../../../config/constants';

export function RequestList({ requests, onRequestClick }) {
  const priorityDiamonds = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Subject</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Employee</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Technician</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Priority</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Stage</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr 
                key={request.id} 
                onClick={() => onRequestClick(request.id)}
                className={`
                  border-b border-gray-100 hover:bg-gray-50 cursor-pointer
                  ${request.isOverdue ? 'bg-red-50 hover:bg-red-100' : ''}
                `}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {request.isOverdue && (
                      <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{request.subject}</p>
                      <p className="text-sm text-gray-500">{request.equipment?.name || 'No equipment'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={request.createdBy?.name || 'Unknown'} size="xs" />
                    <span className="text-sm text-gray-900">{request.createdBy?.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {request.technician ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={request.technician.name} size="xs" />
                      <span className="text-sm text-gray-900">{request.technician.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">{request.category?.name || '-'}</span>
                </td>
                <td className="py-4 px-4">
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
                </td>
                <td className="py-4 px-4">
                  <Badge 
                    variant={
                      request.stage === 'NEW' ? 'primary' : 
                      request.stage === 'IN_PROGRESS' ? 'warning' : 
                      request.stage === 'REPAIRED' ? 'success' : 'default'
                    }
                  >
                    {STAGE_LABELS[request.stage]}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-600">
                    {format(new Date(request.createdAt), 'MMM d, yyyy')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No requests found
          </div>
        )}
      </div>
    </Card>
  );
}
