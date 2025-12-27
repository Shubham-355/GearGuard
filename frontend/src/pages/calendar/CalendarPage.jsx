import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Wrench } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Button, Card, Badge, Modal, Spinner } from '../../components/ui';
import { requestsAPI } from '../../services/api';
import { STAGE_LABELS, PRIORITY_COLORS } from '../../config/constants';

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayRequests, setSelectedDayRequests] = useState([]);

  useEffect(() => {
    fetchCalendarRequests();
  }, [currentMonth]);

  const fetchCalendarRequests = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const response = await requestsAPI.getCalendar({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      // Backend returns { data: { events: [...] } }
      const data = response.data.data;
      const eventsList = data?.events || data || [];
      // Map backend event format to frontend format
      const mappedRequests = (Array.isArray(eventsList) ? eventsList : []).map(event => ({
        id: event.id,
        subject: event.title || event.subject,
        scheduledDate: event.start || event.scheduledDate,
        requestType: event.type || event.requestType,
        stage: event.stage,
        priority: event.priority,
        isOverdue: event.isOverdue,
        equipment: event.equipment,
        technician: event.technician,
        team: event.team,
      }));
      setRequests(mappedRequests);
    } catch (error) {
      // Mock data
      const mockRequests = [
        {
          id: '1',
          subject: 'Monthly Checkup - CNC Machine',
          scheduledDate: format(addMonths(new Date(), 0), 'yyyy-MM-10'),
          requestType: 'PREVENTIVE',
          stage: 'NEW',
          priority: 'MEDIUM',
          equipment: { name: 'CNC Machine 01' },
          technician: { name: 'Mike Tech' },
        },
        {
          id: '2',
          subject: 'Quarterly Maintenance',
          scheduledDate: format(addMonths(new Date(), 0), 'yyyy-MM-15'),
          requestType: 'PREVENTIVE',
          stage: 'IN_PROGRESS',
          priority: 'HIGH',
          equipment: { name: 'Conveyor Belt A' },
          technician: { name: 'Jane Smith' },
        },
        {
          id: '3',
          subject: 'Printer Inspection',
          scheduledDate: format(addMonths(new Date(), 0), 'yyyy-MM-20'),
          requestType: 'PREVENTIVE',
          stage: 'NEW',
          priority: 'LOW',
          equipment: { name: 'Printer 01' },
          technician: null,
        },
        {
          id: '4',
          subject: 'Safety Check',
          scheduledDate: format(addMonths(new Date(), 0), 'yyyy-MM-25'),
          requestType: 'PREVENTIVE',
          stage: 'NEW',
          priority: 'HIGH',
          equipment: { name: 'Elevator' },
          technician: { name: 'Bob Wilson' },
        },
      ];
      setRequests(mockRequests);
    } finally {
      setLoading(false);
    }
  };

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getRequestsForDay = (date) => {
    if (!Array.isArray(requests)) return [];
    return requests.filter(req => {
      if (!req.scheduledDate) return false;
      const reqDate = parseISO(req.scheduledDate);
      return isSameDay(reqDate, date);
    });
  };

  const handleDateClick = (date) => {
    const dayRequests = getRequestsForDay(date);
    setSelectedDate(date);
    setSelectedDayRequests(dayRequests);
  };

  const handleCreateRequest = (date) => {
    navigate('/maintenance/new', { 
      state: { 
        scheduledDate: format(date, 'yyyy-MM-dd'),
        requestType: 'PREVENTIVE'
      } 
    });
  };

  const priorityDiamonds = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Calendar</h1>
            <p className="text-gray-500">View and schedule preventive maintenance</p>
          </div>
          <Button onClick={() => navigate('/maintenance/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const dayRequests = getRequestsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`
                      min-h-24 p-2 border rounded-lg cursor-pointer transition-colors
                      ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                      ${isCurrentDay ? 'border-blue-500 border-2' : 'border-gray-200'}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Request Indicators */}
                    <div className="space-y-1">
                      {dayRequests.slice(0, 2).map((req) => (
                        <div
                          key={req.id}
                          className={`
                            text-xs px-1.5 py-0.5 rounded truncate
                            ${req.requestType === 'PREVENTIVE' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          `}
                        >
                          {req.subject}
                        </div>
                      ))}
                      {dayRequests.length > 2 && (
                        <div className="text-xs text-gray-500 px-1.5">
                          +{dayRequests.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-100 rounded" />
          <span>Preventive Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 rounded" />
          <span>Corrective Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 rounded" />
          <span>Today</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal
        isOpen={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
        size="lg"
      >
        {selectedDate && (
          <div>
            {selectedDayRequests.length > 0 ? (
              <div className="space-y-3 mb-6">
                {selectedDayRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedDate(null);
                      navigate(`/maintenance/${req.id}`);
                    }}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                        ${req.requestType === 'PREVENTIVE' ? 'bg-purple-100' : 'bg-red-100'}
                      `}>
                        <Wrench className={`w-5 h-5 
                          ${req.requestType === 'PREVENTIVE' ? 'text-purple-600' : 'text-red-600'}
                        `} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{req.subject}</p>
                        <p className="text-sm text-gray-500">
                          {req.equipment?.name || 'No equipment'} 
                          {req.technician && ` • ${req.technician.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < priorityDiamonds[req.priority] 
                                ? PRIORITY_COLORS[req.priority] 
                                : 'text-gray-300'
                            }`}
                          >
                            ◆
                          </span>
                        ))}
                      </div>
                      <Badge 
                        variant={
                          req.stage === 'NEW' ? 'primary' : 
                          req.stage === 'IN_PROGRESS' ? 'warning' : 
                          req.stage === 'REPAIRED' ? 'success' : 'default'
                        }
                      >
                        {STAGE_LABELS[req.stage]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 mb-6">
                <p>No maintenance scheduled for this day</p>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={() => handleCreateRequest(selectedDate)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance for This Day
            </Button>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
