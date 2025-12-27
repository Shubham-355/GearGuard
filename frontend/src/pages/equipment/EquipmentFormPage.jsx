import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { equipmentAPI, categoriesAPI, departmentsAPI, teamsAPI, usersAPI, workCentersAPI } from '../../services/api';

export function EquipmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    serialNumber: '',
    model: '',
    categoryId: '',
    departmentId: '',
    ownerId: '',
    technicianId: '',
    maintenanceTeamId: '',
    workCenterId: '',
    location: '',
    purchaseDate: '',
    warrantyExpiry: '',
    description: '',
    healthPercentage: 100,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDropdownData();
    if (isEdit) {
      fetchEquipment();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [catRes, deptRes, teamsRes, techRes, empRes, wcRes] = await Promise.all([
        categoriesAPI.getAll({ limit: 100 }),
        departmentsAPI.getAll({ limit: 100 }),
        teamsAPI.getAll({ limit: 100 }),
        usersAPI.getTechnicians(),
        usersAPI.getAll({ limit: 100 }),
        workCentersAPI.getAll({ limit: 100 }),
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
      
      setCategories(extractData(catRes));
      setDepartments(extractData(deptRes));
      setTeams(extractData(teamsRes));
      setTechnicians(extractData(techRes));
      setEmployees(extractData(empRes));
      setWorkCenters(extractData(wcRes));
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
      toast.error('Failed to load form options');
      // Keep empty arrays instead of mock data
      setCategories([]);
      setDepartments([]);
      setTeams([]);
      setTechnicians([]);
      setEmployees([]);
      setWorkCenters([]);
    }
  };

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getById(id);
      const item = response.data.data?.equipment || response.data.data;
      setFormData({
        name: item.name || '',
        serialNumber: item.serialNumber || '',
        model: item.model || '',
        categoryId: item.categoryId || '',
        departmentId: item.departmentId || '',
        ownerId: item.ownerId || '',
        technicianId: item.technicianId || '',
        maintenanceTeamId: item.maintenanceTeamId || '',
        workCenterId: item.workCenterId || '',
        location: item.location || '',
        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
        warrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.split('T')[0] : '',
        description: item.description || '',
        healthPercentage: item.healthPercentage || 100,
      });
    } catch (error) {
      console.error('Failed to load equipment:', error);
      toast.error('Failed to load equipment');
      navigate('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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
        name: formData.name,
        serialNumber: formData.serialNumber || null,
        model: formData.model || null,
        categoryId: formData.categoryId || null,
        departmentId: formData.departmentId || null,
        ownerId: formData.ownerId || null,
        technicianId: formData.technicianId || null,
        maintenanceTeamId: formData.maintenanceTeamId || null,
        workCenterId: formData.workCenterId || null,
        location: formData.location || null,
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiry: formData.warrantyExpiry || null,
        description: formData.description || null,
        healthPercentage: parseInt(formData.healthPercentage) || 100,
      };

      if (isEdit) {
        await equipmentAPI.update(id, data);
        toast.success('Equipment updated successfully');
      } else {
        await equipmentAPI.create(data);
        toast.success('Equipment created successfully');
      }
      navigate('/equipment');
    } catch (error) {
      console.error('Failed to save equipment:', error);
      toast.error(error.response?.data?.message || 'Failed to save equipment');
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
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Equipment
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Equipment' : 'Add New Equipment'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Equipment Name"
                    placeholder="e.g., CNC Machine 01"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                  />
                  <Input
                    label="Serial Number"
                    placeholder="e.g., CNC-001"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                <Input
                  label="Model"
                  placeholder="e.g., Model XYZ-500"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    placeholder="Select category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    options={Array.isArray(categories) ? categories.map(c => ({ value: c.id, label: c.name })) : []}
                  />
                  <Select
                    label="Department"
                    placeholder="Select department"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    options={Array.isArray(departments) ? departments.map(d => ({ value: d.id, label: d.name })) : []}
                  />
                </div>

                <Textarea
                  label="Description"
                  placeholder="Add equipment description..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Location & Assignment</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Location"
                  placeholder="e.g., Building A, Floor 1"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Used By (Employee)"
                    placeholder="Select employee"
                    value={formData.ownerId}
                    onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                    options={Array.isArray(employees) ? employees.map(e => ({ value: e.id, label: e.name })) : []}
                  />
                  <Select
                    label="Work Center"
                    placeholder="Select work center"
                    value={formData.workCenterId}
                    onChange={(e) => setFormData({ ...formData, workCenterId: e.target.value })}
                    options={Array.isArray(workCenters) ? workCenters.map(w => ({ value: w.id, label: w.name })) : []}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Purchase & Warranty</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    label="Purchase Date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    label="Warranty Expiry"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Maintenance</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Maintenance Team"
                  placeholder="Select team"
                  value={formData.maintenanceTeamId}
                  onChange={(e) => setFormData({ ...formData, maintenanceTeamId: e.target.value })}
                  options={Array.isArray(teams) ? teams.map(t => ({ value: t.id, label: t.name })) : []}
                />

                <Select
                  label="Assigned Technician"
                  placeholder="Select technician"
                  value={formData.technicianId}
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  options={Array.isArray(technicians) ? technicians.map(t => ({ value: t.id, label: t.name })) : []}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Health Status</h3>
              </CardHeader>
              <CardContent>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Percentage: {formData.healthPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.healthPercentage}
                  onChange={(e) => setFormData({ ...formData, healthPercentage: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Critical</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/equipment')}
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
