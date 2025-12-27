import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  Card, 
  Modal, 
  Input, 
  Textarea, 
  Spinner, 
  SearchInput,
  EmptyState 
} from '../../components/ui';
import { departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentsAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const departmentsList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setDepartments(departmentsList);
    } catch (error) {
      // Mock data
      const mockDepartments = [
        {
          id: '1',
          name: 'Production',
          code: 'PROD',
          description: 'Manufacturing and production floor',
        },
        {
          id: '2',
          name: 'Facilities',
          code: 'FAC',
          description: 'Building maintenance and facilities management',
        },
        {
          id: '3',
          name: 'IT',
          code: 'IT',
          description: 'Information technology and systems',
        },
        {
          id: '4',
          name: 'Quality Control',
          code: 'QC',
          description: 'Quality assurance and control',
        },
        {
          id: '5',
          name: 'Warehouse',
          code: 'WH',
          description: 'Storage and logistics',
        },
      ];
      setDepartments(mockDepartments);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDepartment) {
        const response = await departmentsAPI.update(editingDepartment.id, formData);
        const updatedDepartment = response.data?.data?.department || { 
          ...editingDepartment,
          ...formData 
        };
        setDepartments(departments.map(d => 
          d.id === editingDepartment.id ? updatedDepartment : d
        ));
        toast.success('Department updated successfully');
      } else {
        const response = await departmentsAPI.create(formData);
        const newDepartment = response.data?.data?.department || { 
          id: Date.now().toString(), 
          ...formData,
        };
        setDepartments([...departments, newDepartment]);
        toast.success('Department created successfully');
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
    if (!confirm(`Are you sure you want to delete "${department.name}"?`)) return;
    
    try {
      await departmentsAPI.delete(department.id);
      setDepartments(departments.filter(d => d.id !== department.id));
      toast.success('Department deleted successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete department';
      toast.error(errorMessage, {
        duration: 6000,
        style: {
          maxWidth: '500px',
        },
      });
    }
  };

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const filteredDepartments = Array.isArray(departments) ? departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-500">Manage company departments</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search departments..."
        />
      </Card>

      {/* Departments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : filteredDepartments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments found"
          description="Create departments to organize your company structure"
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Department</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Description</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((department) => (
                  <tr key={department.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{department.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{department.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(department)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(department)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Production"
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this department..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
