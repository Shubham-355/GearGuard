import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  Wrench,
  CheckCircle,
  XCircle,
  Play,
  AlertTriangle
} from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardContent, 
  Badge, 
  Avatar,
  Modal,
  Input,
  Select,
  Spinner 
} from '../../components/ui';
import { requestsAPI, usersAPI } from '../../services/api';
import { 
  STAGE_LABELS, 
  PRIORITY_LABELS, 
  PRIORITY_COLORS,
  REQUEST_TYPE_LABELS,
  USER_ROLES
} from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

export function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const canManage = [USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER].includes(user?.role);
  const canAssignSelf = user?.role === USER_ROLES.TECHNICIAN;

  useEffect(() => {
    fetchRequest();
    fetchTechnicians();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getById(id);
      // Backend returns { data: { request: {...} } }
      const requestData = response.data.data?.request || response.data.data;
      setRequest(requestData);
    } catch (error) {
      console.error('Failed to fetch request:', error);
      // Mock data for demo
      setRequest({
        id,
        subject: 'Leaking Oil',
        description: 'Machine is leaking oil from the main cylinder. Need immediate attention.',
        stage: 'NEW',
        priority: 'HIGH',
        requestType: 'CORRECTIVE',
        isOverdue: false,
        equipment: { id: '1', name: 'CNC Machine 01', serialNumber: 'CNC-001' },
        category: { id: '1', name: 'Machinery' },
        team: { id: '1', name: 'Mechanics' },
        createdBy: { id: '1', name: 'John Doe', email: 'john@example.com' },
        technician: null,
        scheduledDate: null,
        duration: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await usersAPI.getTechnicians();
      // Backend returns { data: { technicians: [...] } }
      const data = response.data.data;
      const techList = data?.technicians || data || [];
      setTechnicians(Array.isArray(techList) ? techList : []);
    } catch (error) {
      setTechnicians([
        { id: '1', name: 'John Tech' },
        { id: '2', name: 'Jane Smith' },
        { id: '3', name: 'Mike Johnson' },
      ]);
    }
  };

  const handleStageChange = async (newStage) => {
    try {
      await requestsAPI.updateStage(id, newStage);
      setRequest({ ...request, stage: newStage });
      toast.success(`Request moved to ${STAGE_LABELS[newStage]}`);
      
      // If moving to SCRAP, show warning about equipment
      if (newStage === 'SCRAP') {
        toast('Equipment has been flagged for review', { icon: '⚠️' });
      }
    } catch (error) {
      toast.error('Failed to update stage');
      // Optimistic update for demo
      setRequest({ ...request, stage: newStage });
      if (newStage === 'SCRAP') {
        toast('Equipment has been flagged for review', { icon: '⚠️' });
      }
    }
  };

  const handleAssign = async () => {
    try {
      if (canAssignSelf) {
        // Technician picking up request (self-assign)
        await requestsAPI.selfAssign(id);
        setRequest({ 
          ...request, 
          technician: user,
          technicianId: user.id,
          stage: 'IN_PROGRESS'
        });
        toast.success('Request assigned to you successfully');
      } else {
        // Manager assigning to technician
        await requestsAPI.assign(id, selectedTechnician);
        const tech = technicians.find(t => t.id === selectedTechnician);
        setRequest({ 
          ...request, 
          technician: tech,
          technicianId: selectedTechnician,
          stage: request.stage === 'NEW' ? 'IN_PROGRESS' : request.stage
        });
        setShowAssignModal(false);
        toast.success('Technician assigned successfully');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to assign technician';
      toast.error(errorMsg);
    }
  };

  const handleComplete = async () => {
    try {
      await requestsAPI.complete(id, { 
        duration: parseFloat(duration),
        notes 
      });
      setRequest({ 
        ...request, 
        stage: 'REPAIRED',
        duration: parseFloat(duration),
        notes,
        completionDate: new Date().toISOString()
      });
      setShowCompleteModal(false);
      toast.success('Request marked as completed');
    } catch (error) {
      // Demo update
      setRequest({ 
        ...request, 
        stage: 'REPAIRED',
        duration: parseFloat(duration),
        notes,
        completionDate: new Date().toISOString()
      });
      setShowCompleteModal(false);
      toast.success('Request marked as completed');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      await requestsAPI.delete(id);
      toast.success('Request deleted');
      navigate('/maintenance');
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const priorityDiamonds = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!request) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Request not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Maintenance
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{request.subject}</h1>
              {request.isOverdue && (
                <Badge variant="danger">Overdue</Badge>
              )}
            </div>
            <p className="text-gray-500">
              Created by {request.createdBy?.name} {request.createdAt ? `on ${format(new Date(request.createdAt), 'MMM d, yyyy')}` : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {canManage && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/maintenance/${id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            {['NEW', 'IN_PROGRESS', 'REPAIRED'].map((stage, index, arr) => (
              <div key={stage} className="flex items-center flex-1">
                <button
                  onClick={() => handleStageChange(stage)}
                  disabled={!canManage && !canAssignSelf}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full font-medium text-sm
                    transition-colors
                    ${request.stage === stage 
                      ? 'bg-blue-600 text-white' 
                      : arr.indexOf(request.stage) > index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }
                    ${(!canManage && !canAssignSelf) ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  {arr.indexOf(request.stage) > index ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </button>
                {index < arr.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    arr.indexOf(request.stage) > index ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>New Request</span>
            <span>In Progress</span>
            <span>Repaired</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {request.stage === 'NEW' && (
          <>
            {canAssignSelf && (
              <Button onClick={handleAssign}>
                <Play className="w-4 h-4 mr-2" />
                Pick Up Request
              </Button>
            )}
            {canManage && (
              <Button onClick={() => setShowAssignModal(true)}>
                <User className="w-4 h-4 mr-2" />
                Assign Technician
              </Button>
            )}
          </>
        )}
        
        {request.stage === 'IN_PROGRESS' && (
          <Button onClick={() => setShowCompleteModal(true)} variant="success">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Repaired
          </Button>
        )}
        
        {/* Scrap action available for managers at any stage except already scrapped */}
        {canManage && request.stage !== 'SCRAP' && (
          <Button variant="danger" onClick={() => handleStageChange('SCRAP')}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Move to Scrap
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Request Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900">{request.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1">
                    <Badge variant={request.requestType === 'CORRECTIVE' ? 'danger' : 'info'}>
                      {REQUEST_TYPE_LABELS[request.requestType]}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <span
                          key={i}
                          className={`${i < priorityDiamonds[request.priority] ? PRIORITY_COLORS[request.priority] : 'text-gray-300'}`}
                        >
                          ◆
                        </span>
                      ))}
                    </span>
                    <span className="text-gray-700">{PRIORITY_LABELS[request.priority]}</span>
                  </div>
                </div>
              </div>

              {request.scheduledDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {format(new Date(request.scheduledDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              {request.duration && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {request.duration} hours
                  </p>
                </div>
              )}

              {request.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Completion Notes</label>
                  <p className="mt-1 text-gray-900">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Info */}
          {request.equipment && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Equipment Information</h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{request.equipment.name}</p>
                    <p className="text-sm text-gray-500">
                      Serial: {request.equipment.serialNumber || 'N/A'}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/equipment/machines/${request.equipment.id}`)}
                  >
                    View Equipment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Assignment</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar name={request.createdBy?.name || 'Unknown'} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">{request.createdBy?.name}</p>
                    <p className="text-sm text-gray-500">{request.createdBy?.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Assigned Technician</label>
                {request.technician ? (
                  <div className="mt-2 flex items-center gap-3">
                    <Avatar name={request.technician.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{request.technician.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-400">Not assigned</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Team</label>
                <p className="mt-1 text-gray-900">{request.team?.name || 'Not assigned'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="mt-1 text-gray-900">{request.category?.name || 'Not assigned'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Status</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Stage</span>
                  <Badge 
                    variant={
                      request.stage === 'NEW' ? 'primary' : 
                      request.stage === 'IN_PROGRESS' ? 'warning' : 
                      request.stage === 'REPAIRED' ? 'success' : 'default'
                    }
                  >
                    {STAGE_LABELS[request.stage]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{request.createdAt ? format(new Date(request.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                </div>
                {request.completionDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed</span>
                    <span className="text-gray-900">{format(new Date(request.completionDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Technician"
      >
        <div className="space-y-4">
          <Select
            label="Select Technician"
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            options={Array.isArray(technicians) ? technicians.map(t => ({ value: t.id, label: t.name })) : []}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAssign} className="flex-1" disabled={!selectedTechnician}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Request"
      >
        <div className="space-y-4">
          <Input
            type="number"
            label="Duration (hours)"
            placeholder="e.g., 2.5"
            step="0.5"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add completion notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowCompleteModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleComplete} className="flex-1" disabled={!duration}>
              Mark as Repaired
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
