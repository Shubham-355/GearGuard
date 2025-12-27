import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  List, 
  LayoutGrid, 
  Filter, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Button, SearchInput, Tabs, Spinner } from '../../components/ui';
import { KanbanBoard } from './components/KanbanBoard';
import { RequestList } from './components/RequestList';
import { requestsAPI } from '../../services/api';
import { REQUEST_STAGES } from '../../config/constants';

export function MaintenancePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');

  const overdueCount = Array.isArray(requests) ? requests.filter(r => r.isOverdue).length : 0;

  const filterTabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'my', label: 'My Requests' },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
    { id: 'preventive', label: 'Preventive' },
    { id: 'corrective', label: 'Corrective' },
  ];

  useEffect(() => {
    fetchRequests();
  }, [activeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilter === 'my') params.assignedToMe = true;
      if (activeFilter === 'overdue') params.isOverdue = true;
      if (activeFilter === 'preventive') params.requestType = 'PREVENTIVE';
      if (activeFilter === 'corrective') params.requestType = 'CORRECTIVE';
      
      const response = await requestsAPI.getAll(params);
      // Handle paginated response - backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const requestsData = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      // Mock data for demo
      setRequests([
        {
          id: '1',
          subject: 'Leaking Oil',
          description: 'Machine is leaking oil from the main cylinder',
          stage: 'NEW',
          priority: 'HIGH',
          requestType: 'CORRECTIVE',
          isOverdue: false,
          equipment: { id: '1', name: 'CNC Machine 01' },
          category: { id: '1', name: 'Machinery' },
          team: { id: '1', name: 'Mechanics' },
          createdBy: { id: '1', name: 'John Doe' },
          technician: null,
          scheduledDate: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          subject: 'Routine Checkup',
          description: 'Monthly preventive maintenance',
          stage: 'IN_PROGRESS',
          priority: 'MEDIUM',
          requestType: 'PREVENTIVE',
          isOverdue: false,
          equipment: { id: '2', name: 'Printer 01' },
          category: { id: '2', name: 'IT Equipment' },
          team: { id: '2', name: 'IT Support' },
          createdBy: { id: '1', name: 'John Doe' },
          technician: { id: '2', name: 'Jane Smith' },
          scheduledDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          subject: 'Motor Overheating',
          description: 'Main motor is running hot',
          stage: 'NEW',
          priority: 'HIGH',
          requestType: 'CORRECTIVE',
          isOverdue: true,
          equipment: { id: '3', name: 'Conveyor Belt A' },
          category: { id: '1', name: 'Machinery' },
          team: { id: '3', name: 'Electricians' },
          createdBy: { id: '3', name: 'Bob Wilson' },
          technician: null,
          scheduledDate: null,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: '4',
          subject: 'Belt Replacement',
          description: 'Replace worn conveyor belt',
          stage: 'REPAIRED',
          priority: 'LOW',
          requestType: 'CORRECTIVE',
          isOverdue: false,
          equipment: { id: '4', name: 'Conveyor Belt B' },
          category: { id: '1', name: 'Machinery' },
          team: { id: '1', name: 'Mechanics' },
          createdBy: { id: '1', name: 'John Doe' },
          technician: { id: '4', name: 'Mike Johnson' },
          scheduledDate: null,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          completionDate: new Date().toISOString(),
          duration: 2.5,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (requestId, newStage) => {
    try {
      await requestsAPI.updateStage(requestId, newStage);
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, stage: newStage } : req
        )
      );
    } catch (error) {
      console.error('Failed to update stage:', error);
      // Optimistic update for demo
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, stage: newStage } : req
        )
      );
    }
  };

  const filteredRequests = Array.isArray(requests) ? requests.filter(request => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.subject.toLowerCase().includes(query) ||
      request.equipment?.name.toLowerCase().includes(query) ||
      request.createdBy?.name.toLowerCase().includes(query) ||
      request.technician?.name?.toLowerCase().includes(query)
    );
  }) : [];

  // Group requests by stage for Kanban
  const groupedRequests = {
    NEW: filteredRequests.filter(r => r.stage === 'NEW'),
    IN_PROGRESS: filteredRequests.filter(r => r.stage === 'IN_PROGRESS'),
    REPAIRED: filteredRequests.filter(r => r.stage === 'REPAIRED'),
    SCRAP: filteredRequests.filter(r => r.stage === 'SCRAP'),
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search requests..."
            className="lg:max-w-md flex-1"
          />
          <Button onClick={() => navigate('/maintenance/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Tabs 
          tabs={filterTabs} 
          activeTab={activeFilter} 
          onChange={setActiveFilter} 
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'kanban' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard 
          groupedRequests={groupedRequests} 
          onStageChange={handleStageChange}
          onRequestClick={(id) => navigate(`/maintenance/${id}`)}
        />
      ) : (
        <RequestList 
          requests={filteredRequests}
          onRequestClick={(id) => navigate(`/maintenance/${id}`)}
        />
      )}
    </MainLayout>
  );
}
