import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Wrench,
  MapPin,
  Calendar,
  User,
  Users,
  Cog,
  AlertTriangle,
  Building2,
  ClipboardList
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
  Spinner 
} from '../../components/ui';
import { equipmentAPI, requestsAPI } from '../../services/api';
import { 
  EQUIPMENT_STATUS_LABELS, 
  STAGE_LABELS,
  PRIORITY_COLORS,
  USER_ROLES
} from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

export function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [equipment, setEquipment] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const canManage = [USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER].includes(user?.role);

  useEffect(() => {
    fetchEquipment();
    fetchRequests();
  }, [id]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getById(id);
      // Backend returns { data: { equipment: {...} } }
      const data = response.data.data;
      const equipmentData = data?.equipment || data;
      setEquipment(equipmentData);
    } catch (error) {
      // Mock data
      setEquipment({
        id,
        name: 'CNC Machine 01',
        serialNumber: 'CNC-001',
        model: 'XYZ-500',
        status: 'ACTIVE',
        healthPercentage: 85,
        category: { id: '1', name: 'Machinery' },
        department: { id: '1', name: 'Production' },
        owner: { id: '1', name: 'John Doe', email: 'john@example.com' },
        technician: { id: '2', name: 'Mike Tech', email: 'mike@example.com' },
        maintenanceTeam: { id: '1', name: 'Mechanics' },
        workCenter: { id: '1', name: 'Main Assembly Line' },
        location: 'Building A, Floor 1',
        purchaseDate: '2022-06-15',
        warrantyExpiry: '2025-06-15',
        assignedDate: '2023-01-10',
        description: 'High-precision CNC milling machine for metal parts production.',
        createdAt: '2022-06-15T00:00:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await equipmentAPI.getRequests(id);
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const requestsList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setRequests(requestsList);
    } catch (error) {
      // Mock data
      setRequests([
        {
          id: '1',
          subject: 'Leaking Oil',
          stage: 'NEW',
          priority: 'HIGH',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          subject: 'Routine Checkup',
          stage: 'REPAIRED',
          priority: 'MEDIUM',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ]);
    }
  };

  const handleScrap = async () => {
    if (!confirm('Are you sure you want to mark this equipment as scrapped? This action cannot be undone.')) return;
    try {
      const response = await equipmentAPI.scrap(id);
      const updatedEquipment = response.data?.data?.equipment || { ...equipment, status: 'SCRAPPED', scrapDate: new Date().toISOString() };
      setEquipment(updatedEquipment);
      toast.success('Equipment marked as scrapped');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to scrap equipment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await equipmentAPI.delete(id);
      toast.success('Equipment deleted');
      navigate('/equipment');
    } catch (error) {
      toast.error('Failed to delete equipment');
    }
  };

  const getHealthColor = (health) => {
    if (health >= 70) return 'bg-green-500';
    if (health >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const openRequestCount = Array.isArray(requests) ? requests.filter(r => r.stage !== 'REPAIRED' && r.stage !== 'SCRAP').length : 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!equipment) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Equipment not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
              <Badge 
                variant={
                  equipment.status === 'ACTIVE' ? 'success' : 
                  equipment.status === 'UNDER_MAINTENANCE' ? 'warning' : 'danger'
                }
              >
                {EQUIPMENT_STATUS_LABELS[equipment.status]}
              </Badge>
            </div>
            <p className="text-gray-500">
              Serial: {equipment.serialNumber || 'N/A'} • Model: {equipment.model || 'N/A'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Smart Button - Maintenance Requests */}
            <Button 
              variant="primary" 
              onClick={() => setShowRequestsModal(true)}
              className="relative"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Maintenance
              {openRequestCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {openRequestCount}
                </span>
              )}
            </Button>
            
            {canManage && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/equipment/${id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {equipment.status !== 'SCRAPPED' && (
                  <Button variant="warning" onClick={handleScrap}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Scrap
                  </Button>
                )}
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Health Status */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Equipment Health</h3>
            <span className={`text-2xl font-bold ${
              equipment.healthPercentage >= 70 ? 'text-green-600' :
              equipment.healthPercentage >= 30 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {equipment.healthPercentage}%
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getHealthColor(equipment.healthPercentage)} rounded-full transition-all duration-500`}
              style={{ width: `${equipment.healthPercentage}%` }}
            />
          </div>
          {equipment.healthPercentage < 30 && (
            <div className="mt-3 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Critical condition - Requires immediate attention</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Equipment Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{equipment.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Cog className="w-4 h-4 text-gray-400" />
                    {equipment.category?.name || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {equipment.department?.name || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="mt-1 flex items-center gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {equipment.location || 'Not specified'}
                </p>
              </div>

              {equipment.workCenter && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Center</label>
                  <p className="mt-1 text-gray-900">{equipment.workCenter.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Purchase & Warranty</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {equipment.purchaseDate 
                      ? format(new Date(equipment.purchaseDate), 'MMMM d, yyyy')
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Warranty Expiry</label>
                  <p className="mt-1 flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {equipment.warrantyExpiry 
                      ? format(new Date(equipment.warrantyExpiry), 'MMMM d, yyyy')
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Maintenance Requests</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowRequestsModal(true)}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.slice(0, 3).map((request) => (
                    <div 
                      key={request.id}
                      onClick={() => navigate(`/maintenance/${request.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{request.subject}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No maintenance requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Used By</h3>
            </CardHeader>
            <CardContent>
              {equipment.owner ? (
                <div className="flex items-center gap-3">
                  <Avatar name={equipment.owner.name} size="md" />
                  <div>
                    <p className="font-medium text-gray-900">{equipment.owner.name}</p>
                    <p className="text-sm text-gray-500">{equipment.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Not assigned to anyone</p>
              )}
              
              {equipment.assignedDate && (
                <p className="text-sm text-gray-500 mt-3">
                  Assigned on {format(new Date(equipment.assignedDate), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Maintenance Team</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Team</label>
                <p className="mt-1 flex items-center gap-2 text-gray-900">
                  <Users className="w-4 h-4 text-gray-400" />
                  {equipment.maintenanceTeam?.name || 'Not assigned'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Default Technician</label>
                {equipment.technician ? (
                  <div className="mt-2 flex items-center gap-3">
                    <Avatar name={equipment.technician.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{equipment.technician.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-400">Not assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {equipment.status === 'SCRAPPED' && equipment.scrapDate && (
            <Card className="bg-red-50 border-red-200">
              <CardContent>
                <div className="flex items-center gap-3 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Equipment Scrapped</p>
                    <p className="text-sm opacity-80">
                      {format(new Date(equipment.scrapDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            className="w-full" 
            onClick={() => navigate('/maintenance/new', { state: { equipmentId: id } })}
          >
            <Wrench className="w-4 h-4 mr-2" />
            Create Maintenance Request
          </Button>
        </div>
      </div>

      {/* All Requests Modal */}
      <Modal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        title="Maintenance Requests"
        size="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div 
                key={request.id}
                onClick={() => {
                  setShowRequestsModal(false);
                  navigate(`/maintenance/${request.id}`);
                }}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-gray-900">{request.subject}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(request.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < (request.priority === 'HIGH' ? 3 : request.priority === 'MEDIUM' ? 2 : 1) 
                            ? PRIORITY_COLORS[request.priority] 
                            : 'text-gray-300'
                        }`}
                      >
                        ◆
                      </span>
                    ))}
                  </div>
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
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No maintenance requests for this equipment
            </div>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
}
