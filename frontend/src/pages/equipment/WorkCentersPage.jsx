import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  SearchInput, 
  Card, 
  Badge, 
  Modal,
  Input,
  Textarea,
  Select,
  Spinner 
} from '../../components/ui';
import { workCentersAPI } from '../../services/api';

export function WorkCentersPage() {
  const navigate = useNavigate();
  const [workCenters, setWorkCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tag: '',
    costPerHour: '',
    capacityTimeEfficiency: '100',
    oeeTarget: '85',
    alternativeWorkCenterId: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkCenters();
  }, []);

  const fetchWorkCenters = async () => {
    try {
      setLoading(true);
      const response = await workCentersAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const centersList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setWorkCenters(centersList);
    } catch (error) {
      // Mock data
      setWorkCenters([
        {
          id: '1',
          name: 'Main Assembly Line',
          code: 'WC-ASM-01',
          tag: 'Assembly',
          costPerHour: 150,
          capacityTimeEfficiency: 95,
          oeeTarget: 85,
          alternativeWorkCenter: { id: '2', name: 'Secondary Assembly Line' },
          isActive: true,
        },
        {
          id: '2',
          name: 'Secondary Assembly Line',
          code: 'WC-ASM-02',
          tag: 'Assembly',
          costPerHour: 120,
          capacityTimeEfficiency: 88,
          oeeTarget: 80,
          alternativeWorkCenter: null,
          isActive: true,
        },
        {
          id: '3',
          name: 'CNC Station',
          code: 'WC-CNC-01',
          tag: 'Machining',
          costPerHour: 200,
          capacityTimeEfficiency: 92,
          oeeTarget: 90,
          alternativeWorkCenter: null,
          isActive: true,
        },
        {
          id: '4',
          name: 'Quality Control',
          code: 'WC-QC-01',
          tag: 'QC',
          costPerHour: 80,
          capacityTimeEfficiency: 100,
          oeeTarget: 95,
          alternativeWorkCenter: null,
          isActive: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        code: item.code || '',
        tag: item.tag || '',
        costPerHour: item.costPerHour?.toString() || '',
        capacityTimeEfficiency: item.capacityTimeEfficiency?.toString() || '100',
        oeeTarget: item.oeeTarget?.toString() || '85',
        alternativeWorkCenterId: item.alternativeWorkCenter?.id || '',
        description: item.description || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        code: '',
        tag: '',
        costPerHour: '',
        capacityTimeEfficiency: '100',
        oeeTarget: '85',
        alternativeWorkCenterId: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        costPerHour: parseFloat(formData.costPerHour) || 0,
        capacityTimeEfficiency: parseFloat(formData.capacityTimeEfficiency) || 100,
        oeeTarget: parseFloat(formData.oeeTarget) || 85,
      };

      if (editingItem) {
        await workCentersAPI.update(editingItem.id, data);
        toast.success('Work center updated');
      } else {
        await workCentersAPI.create(data);
        toast.success('Work center created');
      }
      setShowModal(false);
      fetchWorkCenters();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
      // Demo: update local state
      if (editingItem) {
        setWorkCenters(prev => prev.map(wc => 
          wc.id === editingItem.id ? { ...wc, ...formData } : wc
        ));
      } else {
        setWorkCenters(prev => [...prev, { id: Date.now().toString(), ...formData, isActive: true }]);
      }
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this work center?')) return;
    try {
      await workCentersAPI.delete(id);
      toast.success('Work center deleted');
      setWorkCenters(prev => prev.filter(wc => wc.id !== id));
    } catch (error) {
      toast.error('Failed to delete');
      setWorkCenters(prev => prev.filter(wc => wc.id !== id));
    }
  };

  const filteredWorkCenters = Array.isArray(workCenters) ? workCenters.filter(wc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      wc.name.toLowerCase().includes(query) ||
      wc.code?.toLowerCase().includes(query) ||
      wc.tag?.toLowerCase().includes(query)
    );
  }) : [];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Centers</h1>
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search work centers..."
            className="lg:max-w-md flex-1"
          />
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Work Center
          </Button>
        </div>
      </div>

      {/* Work Centers List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Work Center</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Tag</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Alternative WC</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Cost/Hour</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Capacity Eff.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">OEE Target</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkCenters.map((wc) => (
                  <tr key={wc.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{wc.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{wc.code || '-'}</code>
                    </td>
                    <td className="py-4 px-4">
                      {wc.tag ? (
                        <Badge variant="default">{wc.tag}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {wc.alternativeWorkCenter?.name || '-'}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      ${wc.costPerHour?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${wc.capacityTimeEfficiency || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{wc.capacityTimeEfficiency || 0}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600">{wc.oeeTarget || 0}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(wc)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wc.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredWorkCenters.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No work centers found
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Work Center' : 'Add Work Center'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              placeholder="e.g., Main Assembly Line"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Code"
              placeholder="e.g., WC-ASM-01"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tag"
              placeholder="e.g., Assembly"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
            />
            <Select
              label="Alternative Work Center"
              placeholder="Select alternative"
              value={formData.alternativeWorkCenterId}
              onChange={(e) => setFormData({ ...formData, alternativeWorkCenterId: e.target.value })}
              options={Array.isArray(workCenters) 
                ? workCenters
                    .filter(wc => wc.id !== editingItem?.id)
                    .map(wc => ({ value: wc.id, label: wc.name }))
                : []
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Cost per Hour ($)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.costPerHour}
              onChange={(e) => setFormData({ ...formData, costPerHour: e.target.value })}
            />
            <Input
              label="Capacity Time Efficiency (%)"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="100"
              value={formData.capacityTimeEfficiency}
              onChange={(e) => setFormData({ ...formData, capacityTimeEfficiency: e.target.value })}
            />
            <Input
              label="OEE Target (%)"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="85"
              value={formData.oeeTarget}
              onChange={(e) => setFormData({ ...formData, oeeTarget: e.target.value })}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Add description..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
