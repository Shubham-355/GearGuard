import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Filter } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  SearchInput, 
  Card, 
  Badge, 
  Avatar, 
  Spinner,
  Select 
} from '../../components/ui';
import { equipmentAPI, categoriesAPI, departmentsAPI } from '../../services/api';
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_COLORS } from '../../config/constants';

export function EquipmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    department: '',
    status: '',
    health: searchParams.get('health') || '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Filter out empty string values and map to backend parameter names
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Map frontend filter names to backend parameter names
          if (key === 'category') {
            acc['categoryId'] = value;
          } else if (key === 'department') {
            acc['departmentId'] = value;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});
      
      const [equipRes, catRes, deptRes] = await Promise.all([
        equipmentAPI.getAll(cleanFilters),
        categoriesAPI.getAll(),
        departmentsAPI.getAll(),
      ]);
      
      // Handle paginated response - extract data array
      const extractItems = (res) => {
        const data = res.data.data;
        return Array.isArray(data) ? data : (data?.data || []);
      };
      
      // Map the equipment data to include openRequestCount
      const equipmentData = extractItems(equipRes).map(item => ({
        ...item,
        openRequestCount: item._count?.maintenanceRequests || 0,
      }));
      
      setEquipment(equipmentData);
      setCategories(extractItems(catRes));
      setDepartments(extractItems(deptRes));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data
      setEquipment([
        {
          id: '1',
          name: 'CNC Machine 01',
          serialNumber: 'CNC-001',
          status: 'ACTIVE',
          healthPercentage: 85,
          category: { id: '1', name: 'Machinery' },
          department: { id: '1', name: 'Production' },
          owner: { id: '1', name: 'John Doe' },
          technician: { id: '2', name: 'Mike Tech' },
          location: 'Building A, Floor 1',
          openRequestCount: 2,
        },
        {
          id: '2',
          name: 'Printer 01',
          serialNumber: 'PRT-001',
          status: 'UNDER_MAINTENANCE',
          healthPercentage: 45,
          category: { id: '2', name: 'IT Equipment' },
          department: { id: '2', name: 'IT' },
          owner: { id: '3', name: 'Jane Smith' },
          technician: { id: '4', name: 'Bob Wilson' },
          location: 'Building B, Floor 2',
          openRequestCount: 1,
        },
        {
          id: '3',
          name: 'Conveyor Belt A',
          serialNumber: 'CNV-001',
          status: 'ACTIVE',
          healthPercentage: 25,
          category: { id: '1', name: 'Machinery' },
          department: { id: '1', name: 'Production' },
          owner: null,
          technician: { id: '2', name: 'Mike Tech' },
          location: 'Building A, Floor 1',
          openRequestCount: 3,
        },
        {
          id: '4',
          name: 'Laptop Dell XPS',
          serialNumber: 'LPT-001',
          status: 'ACTIVE',
          healthPercentage: 92,
          category: { id: '2', name: 'IT Equipment' },
          department: { id: '3', name: 'HR' },
          owner: { id: '5', name: 'Alice Brown' },
          technician: { id: '4', name: 'Bob Wilson' },
          location: 'Building B, Floor 3',
          openRequestCount: 0,
        },
      ]);
      setCategories([
        { id: '1', name: 'Machinery' },
        { id: '2', name: 'IT Equipment' },
        { id: '3', name: 'Vehicles' },
      ]);
      setDepartments([
        { id: '1', name: 'Production' },
        { id: '2', name: 'IT' },
        { id: '3', name: 'HR' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipment = Array.isArray(equipment) ? equipment.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.serialNumber?.toLowerCase().includes(query) ||
      item.category?.name.toLowerCase().includes(query) ||
      item.department?.name.toLowerCase().includes(query) ||
      item.owner?.name.toLowerCase().includes(query)
    );
  }).filter(item => {
    if (filters.health === 'critical' && item.healthPercentage >= 30) return false;
    return true;
  }) : [];

  const getHealthColor = (health) => {
    if (health >= 70) return 'bg-green-500';
    if (health >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Machines & Tools</h1>
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search equipment..."
            className="lg:max-w-md flex-1"
          />
          <Button onClick={() => navigate('/equipment/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-end gap-3 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter className="w-4 h-4" />
        </div>
        <Select
          placeholder="All Categories"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          options={Array.isArray(categories) ? categories.map(c => ({ value: c.id, label: c.name })) : []}
          className="md:w-48 flex-shrink-0"
        />
        <Select
          placeholder="All Departments"
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          options={Array.isArray(departments) ? departments.map(d => ({ value: d.id, label: d.name })) : []}
          className="md:w-48 flex-shrink-0"
        />
        <Select
          placeholder="All Status"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
            { value: 'SCRAPPED', label: 'Scrapped' },
          ]}
          className="md:w-52 flex-shrink-0"
        />
      </div>

      {/* Critical Equipment Alert */}
      {filters.health === 'critical' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Showing equipment with health below 30%</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilters({ ...filters, health: '' })}
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* Equipment List */}
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
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Equipment</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Serial</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Used By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Health</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Requests</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => navigate(`/equipment/${item.id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {item.healthPercentage < 30 && (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{item.serialNumber || '-'}</td>
                    <td className="py-4 px-4 text-gray-600">{item.category?.name || '-'}</td>
                    <td className="py-4 px-4 text-gray-600">{item.department?.name || '-'}</td>
                    <td className="py-4 px-4">
                      {item.owner ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={item.owner.name} size="xs" />
                          <span className="text-gray-600">{item.owner.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getHealthColor(item.healthPercentage)} rounded-full`}
                            style={{ width: `${item.healthPercentage}%` }}
                          />
                        </div>
                        <span className={`text-sm ${item.healthPercentage < 30 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {item.healthPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant={
                          item.status === 'ACTIVE' ? 'success' : 
                          item.status === 'UNDER_MAINTENANCE' ? 'warning' : 'danger'
                        }
                      >
                        {EQUIPMENT_STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {item.openRequestCount > 0 ? (
                        <Badge variant="primary">{item.openRequestCount} Open</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEquipment.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No equipment found
              </div>
            )}
          </div>
        </Card>
      )}
    </MainLayout>
  );
}
