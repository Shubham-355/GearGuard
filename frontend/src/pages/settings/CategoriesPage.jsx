import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Building2 } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  Card, 
  Modal, 
  Input, 
  Textarea, 
  Select, 
  Spinner, 
  SearchInput,
  EmptyState 
} from '../../components/ui';
import { categoriesAPI, departmentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const categoriesList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      // Map responsibleDept to department for consistency
      const transformedCategories = categoriesList.map(cat => ({
        ...cat,
        department: cat.responsibleDept
      }));
      setCategories(transformedCategories);
    } catch (error) {
      // Mock data
      const mockCategories = [
        {
          id: '1',
          name: 'Mechanical',
          description: 'Mechanical equipment maintenance',
          department: { id: 'd1', name: 'Production' },
        },
        {
          id: '2',
          name: 'Electrical',
          description: 'Electrical systems and wiring',
          department: { id: 'd2', name: 'Facilities' },
        },
        {
          id: '3',
          name: 'HVAC',
          description: 'Heating, ventilation and air conditioning',
          department: { id: 'd2', name: 'Facilities' },
        },
        {
          id: '4',
          name: 'Plumbing',
          description: 'Water and drainage systems',
          department: { id: 'd2', name: 'Facilities' },
        },
        {
          id: '5',
          name: 'IT Equipment',
          description: 'Computers, servers, and network equipment',
          department: { id: 'd3', name: 'IT' },
        },
      ];
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const departmentsList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setDepartments(departmentsList);
    } catch (error) {
      // Mock data
      setDepartments([
        { id: 'd1', name: 'Production' },
        { id: 'd2', name: 'Facilities' },
        { id: 'd3', name: 'IT' },
        { id: 'd4', name: 'Quality Control' },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        const response = await categoriesAPI.update(editingCategory.id, {
          name: formData.name,
          description: formData.description,
          responsibleDeptId: formData.departmentId
        });
        const updatedCategory = response.data?.data?.category || {
          ...editingCategory,
          ...formData,
          department: departments.find(d => d.id === formData.departmentId)
        };
        // Map responsibleDept to department
        if (updatedCategory.responsibleDept) {
          updatedCategory.department = updatedCategory.responsibleDept;
        }
        setCategories(categories.map(c => 
          c.id === editingCategory.id ? updatedCategory : c
        ));
        toast.success('Category updated successfully');
      } else {
        const response = await categoriesAPI.create({
          name: formData.name,
          description: formData.description,
          responsibleDeptId: formData.departmentId
        });
        const newCategory = response.data?.data?.category || { 
          id: Date.now().toString(), 
          ...formData,
          department: departments.find(d => d.id === formData.departmentId),
        };
        // Map responsibleDept to department
        if (newCategory.responsibleDept) {
          newCategory.department = newCategory.responsibleDept;
        }
        setCategories([...categories, newCategory]);
        toast.success('Category created successfully');
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    
    try {
      await categoriesAPI.delete(category.id);
      setCategories(categories.filter(c => c.id !== category.id));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        departmentId: category.department?.id || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        departmentId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      departmentId: '',
    });
  };

  const filteredCategories = Array.isArray(categories) ? categories.filter(category =>
    category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category?.department?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          </div>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="lg:max-w-md flex-1"
          />
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories found"
          description="Create categories to organize your equipment"
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Category</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Description</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Responsible Dept</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Tag className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{category.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{category.department?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
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
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Mechanical"
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this category..."
            rows={3}
          />

          <Select
            label="Responsible Department"
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            options={departments.map(dept => ({
              value: dept.id,
              label: dept.name
            }))}
            placeholder="Select department..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
