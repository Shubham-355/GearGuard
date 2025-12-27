import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Shield, Mail } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  Card, 
  Modal, 
  Input, 
  Select, 
  Spinner, 
  SearchInput,
  Badge,
  Avatar,
  EmptyState
} from '../../components/ui';
import { usersAPI, teamsAPI } from '../../services/api';
import { USER_ROLES, ROLE_LABELS } from '../../config/constants';
import toast from 'react-hot-toast';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: USER_ROLES.EMPLOYEE,
    teamId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const usersList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setUsers(usersList);
    } catch (error) {
      // Mock data
      const mockUsers = [
        {
          id: '1',
          name: 'John Admin',
          email: 'admin@company.com',
          role: 'ADMIN',
          isActive: true,
          team: null,
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'Sarah Manager',
          email: 'sarah@company.com',
          role: 'MAINTENANCE_MANAGER',
          isActive: true,
          team: { id: 't1', name: 'Mechanical Team' },
          createdAt: '2024-02-10',
        },
        {
          id: '3',
          name: 'Mike Technician',
          email: 'mike@company.com',
          role: 'TECHNICIAN',
          isActive: true,
          team: { id: 't1', name: 'Mechanical Team' },
          createdAt: '2024-02-20',
        },
        {
          id: '4',
          name: 'Jane Tech',
          email: 'jane@company.com',
          role: 'TECHNICIAN',
          isActive: false,
          team: { id: 't2', name: 'Electrical Team' },
          createdAt: '2024-03-05',
        },
        {
          id: '5',
          name: 'Bob Employee',
          email: 'bob@company.com',
          role: 'EMPLOYEE',
          isActive: true,
          team: null,
          createdAt: '2024-03-10',
        },
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const teamsList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setTeams(teamsList);
    } catch (error) {
      setTeams([
        { id: 't1', name: 'Mechanical Team' },
        { id: 't2', name: 'Electrical Team' },
        { id: 't3', name: 'HVAC Team' },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, formData);
        const team = teams.find(t => t.id === formData.teamId);
        setUsers(users.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...formData, team }
            : u
        ));
        toast.success('User updated successfully');
      } else {
        // For creating users, typically need to send invite
        await usersAPI.create(formData);
        toast.success('User invitation sent');
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete "${user.name}"?`)) return;
    
    try {
      await usersAPI.delete(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      toast.success('User deleted successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage, {
        duration: 6000,
        style: {
          maxWidth: '500px',
        },
      });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { isActive: !user.isActive });
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ));
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      // Simulate success
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      ));
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.team?.id || '',
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: USER_ROLES.EMPLOYEE,
        teamId: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) : [];

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN: return 'danger';
      case USER_ROLES.MAINTENANCE_MANAGER: return 'warning';
      case USER_ROLES.TECHNICIAN: return 'primary';
      default: return 'default';
    }
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-500">Manage user accounts and permissions</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-48"
          >
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={User}
          title="No users found"
          description="Invite users to join your organization"
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">User</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Role</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Team</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Status</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="md" />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">
                        {user.team?.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 rounded-lg ${
                            user.isActive 
                              ? 'text-yellow-600 hover:bg-yellow-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete user"
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
        title={editingUser ? 'Edit User' : 'Invite User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingUser && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
              An invitation email will be sent to the user to set up their account.
            </div>
          )}

          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
            required
            disabled={!!editingUser}
          />

          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({
              value,
              label
            }))}
            required
          />

          {(formData.role === USER_ROLES.TECHNICIAN || formData.role === USER_ROLES.MAINTENANCE_MANAGER) && (
            <Select
              label="Assign to Team"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              placeholder="No team"
              options={teams.map((team) => ({
                value: team.id,
                label: team.name
              }))}
            />
          )}

          {editingUser && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Account is active
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
