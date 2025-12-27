import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  Input, 
  Select, 
  Textarea, 
  Card, 
  CardHeader, 
  CardContent,
  Spinner 
} from '../../components/ui';
import { requestsAPI, equipmentAPI, teamsAPI, categoriesAPI, usersAPI } from '../../services/api';
import { REQUEST_TYPES, REQUEST_TYPE_LABELS, PRIORITIES, PRIORITY_LABELS } from '../../config/constants';
import { useAuthStore } from '../../store/authStore';

export function RequestFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    requestType: location.state?.requestType || 'CORRECTIVE',
    priority: 'MEDIUM',
    equipmentId: '',
    categoryId: '',
    teamId: '',
    technicianId: '',
    scheduledDate: location.state?.scheduledDate || '',
    duration: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDropdownData();
    if (isEdit) {
      fetchRequest();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [equipRes, teamsRes, catRes, techRes] = await Promise.all([
        equipmentAPI.getAll({ limit: 100 }),
        teamsAPI.getAll({ limit: 100 }),
        categoriesAPI.getAll({ limit: 100 }),
        usersAPI.getTechnicians(),
      ]);
      
      // Handle paginated responses - extract items array
      const extractData = (res) => {
        const data = res.data.data;
        // Handle different response structures
        if (Array.isArray(data)) return data;
        if (data?.items) return data.items;
        if (data?.technicians) return data.technicians; // For technicians endpoint
        if (data?.data) return data.data;
        return [];
      };
      
      setEquipment(extractData(equipRes));
      setTeams(extractData(teamsRes));
      setCategories(extractData(catRes));
      setTechnicians(extractData(techRes));
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
      toast.error('Failed to load form options');
      // Keep empty arrays to show the form is still functional
      setEquipment([]);
      setTeams([]);
      setCategories([]);
      setTechnicians([]);
    }
  };

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getById(id);
      const request = response.data.data?.request || response.data.data;
      setFormData({
        subject: request.subject || '',
        description: request.description || '',
        requestType: request.requestType || 'CORRECTIVE',
        priority: request.priority || 'MEDIUM',
        equipmentId: request.equipmentId || '',
        categoryId: request.categoryId || '',
        teamId: request.teamId || '',
        technicianId: request.technicianId || '',
        scheduledDate: request.scheduledDate ? request.scheduledDate.split('T')[0] : '',
        duration: request.duration || '',
      });
    } catch (error) {
      console.error('Failed to fetch request:', error);
      toast.error('Failed to load request');
      navigate('/maintenance');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill category and team when equipment is selected
  const handleEquipmentChange = (equipmentId) => {
    setFormData(prev => ({ ...prev, equipmentId }));
    
    const selectedEquipment = equipment.find(e => e.id === equipmentId);
    if (selectedEquipment) {
      setFormData(prev => ({
        ...prev,
        equipmentId,
        categoryId: selectedEquipment.categoryId || prev.categoryId,
        teamId: selectedEquipment.maintenanceTeamId || prev.teamId,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Equipment is required';
    }
    if (formData.requestType === 'PREVENTIVE' && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required for preventive maintenance';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Clean up the data - remove empty strings and convert to null
      const data = {
        subject: formData.subject,
        description: formData.description || null,
        requestType: formData.requestType,
        priority: formData.priority,
        equipmentId: formData.equipmentId || null,
        categoryId: formData.categoryId || null,
        teamId: formData.teamId || null,
        technicianId: formData.technicianId || null,
        scheduledDate: formData.scheduledDate || null,
        duration: formData.duration ? parseFloat(formData.duration) : null,
      };

      if (isEdit) {
        await requestsAPI.update(id, data);
        toast.success('Request updated successfully');
      } else {
        await requestsAPI.create(data);
        toast.success('Request created successfully');
      }
      navigate('/maintenance');
    } catch (error) {
      console.error('Failed to save request:', error);
      toast.error(error.response?.data?.message || 'Failed to save request');
    } finally {
      setSubmitting(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Request' : 'New Maintenance Request'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Request Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Subject"
                  placeholder="What is wrong? e.g., Leaking Oil"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  error={errors.subject}
                />

                <Textarea
                  label="Description"
                  placeholder="Provide more details about the issue..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Type
                    </label>
                    <div className="flex gap-4">
                      {Object.entries(REQUEST_TYPES).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="requestType"
                            value={value}
                            checked={formData.requestType === value}
                            onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {value === 'CORRECTIVE' ? 'Corrective (Breakdown)' : 'Preventive (Routine)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="flex gap-4">
                      {Object.entries(PRIORITIES).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="priority"
                            value={value}
                            checked={formData.priority === value}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex items-center gap-1 text-sm text-gray-700">
                            <span className={`${
                              value === 'LOW' ? 'text-green-500' : 
                              value === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {'◆'.repeat(value === 'LOW' ? 1 : value === 'MEDIUM' ? 2 : 3)}
                            </span>
                            {PRIORITY_LABELS[key]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Equipment Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Equipment"
                  placeholder="Select equipment"
                  value={formData.equipmentId}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  options={Array.isArray(equipment) ? equipment.map(e => ({ value: e.id, label: e.name })) : []}
                  error={errors.equipmentId}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Category (Auto-filled)"
                    placeholder="Select category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    options={Array.isArray(categories) ? categories.map(c => ({ value: c.id, label: c.name })) : []}
                  />

                  <Select
                    label="Team (Auto-filled)"
                    placeholder="Select team"
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    options={Array.isArray(teams) ? teams.map(t => ({ value: t.id, label: t.name })) : []}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Assignment</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Assign Technician"
                  placeholder="Select technician"
                  value={formData.technicianId}
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  options={Array.isArray(technicians) ? technicians.map(t => ({ value: t.id, label: t.name })) : []}
                />

                <Input
                  type="date"
                  label="Scheduled Date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  error={errors.scheduledDate}
                />

                {isEdit && (
                  <Input
                    type="number"
                    label="Duration (hours)"
                    placeholder="e.g., 2.5"
                    step="0.5"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="text-sm text-blue-800">
                <p className="font-medium mb-2">Auto-Fill Feature</p>
                <p>
                  When you select an equipment, the system will automatically fill in 
                  the Category and Maintenance Team based on the equipment's configuration.
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/maintenance')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={submitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
