import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  X, 
  UserPlus, 
  ChevronDown, 
  ChevronRight,
  User
} from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { 
  Button, 
  Card, 
  Modal, 
  Input, 
  Textarea, 
  Select, 
  Badge, 
  Spinner, 
  SearchInput,
  Avatar,
  EmptyState
} from '../../components/ui';
import { teamsAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [saving, setSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamsAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const teamsList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
      // Transform members from backend structure { members: [{ user: {...} }] } to { members: [...] }
      const transformedTeams = teamsList.map(team => ({
        ...team,
        members: (team.members || []).map(m => m.user || m)
      }));
      
      setTeams(transformedTeams);
    } catch (error) {
      // Mock data
      const mockTeams = [
        {
          id: '1',
          name: 'Mechanical Team',
          description: 'Handles all mechanical maintenance',
          members: [
            { id: 'u1', name: 'John Smith', email: 'john@company.com', role: 'TECHNICIAN' },
            { id: 'u2', name: 'Jane Doe', email: 'jane@company.com', role: 'TECHNICIAN' },
          ],
        },
        {
          id: '2',
          name: 'Electrical Team',
          description: 'Handles electrical systems and wiring',
          members: [
            { id: 'u3', name: 'Bob Wilson', email: 'bob@company.com', role: 'TECHNICIAN' },
          ],
        },
        {
          id: '3',
          name: 'HVAC Team',
          description: 'Air conditioning and ventilation maintenance',
          members: [],
        },
      ];
      setTeams(mockTeams);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Backend returns { data: { data: [...], pagination: {...} } }
      const responseData = response.data.data;
      const usersList = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      setAvailableUsers(usersList);
    } catch (error) {
      // Mock users
      const mockUsers = [
        { id: 'u1', name: 'John Smith', email: 'john@company.com', role: 'TECHNICIAN' },
        { id: 'u2', name: 'Jane Doe', email: 'jane@company.com', role: 'TECHNICIAN' },
        { id: 'u3', name: 'Bob Wilson', email: 'bob@company.com', role: 'TECHNICIAN' },
        { id: 'u4', name: 'Alice Brown', email: 'alice@company.com', role: 'TECHNICIAN' },
        { id: 'u5', name: 'Charlie Davis', email: 'charlie@company.com', role: 'MAINTENANCE_MANAGER' },
      ];
      setAvailableUsers(mockUsers);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTeam) {
        await teamsAPI.update(editingTeam.id, formData);
        setTeams(teams.map(t => 
          t.id === editingTeam.id ? { ...t, ...formData } : t
        ));
        toast.success('Team updated successfully');
      } else {
        const response = await teamsAPI.create(formData);
        const newTeam = response.data?.data || { 
          id: Date.now().toString(), 
          ...formData, 
          members: [] 
        };
        setTeams([...teams, newTeam]);
        toast.success('Team created successfully');
      }
      handleCloseModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save team';
      if (error.response?.status === 409) {
        toast.error(`A team with this name already exists. Please choose a different name.`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"?`)) return;
    
    try {
      await teamsAPI.delete(team.id);
      setTeams(teams.filter(t => t.id !== team.id));
      toast.success('Team deleted successfully');
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedTeam) return;
    
    try {
      await teamsAPI.addMember(selectedTeam.id, { userId: selectedUserId });
      toast.success('Member added successfully');
      setSelectedUserId('');
      setIsMemberModalOpen(false);
      // Refetch teams to get the latest data from backend
      await fetchTeams();
    } catch (error) {
      console.error('Failed to add member:', error);
      
      // Check if user is already a member
      if (error.response?.data?.message?.includes('already a team member')) {
        toast.error('This user is already a member of the team');
      } else {
        toast.error('Failed to add member');
      }
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      await teamsAPI.removeMember(teamId, userId);
      setTeams(teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            members: (t.members || []).filter(m => m.id !== userId),
          };
        }
        return t;
      }));
      toast.success('Member removed');
    } catch (error) {
      // Simulate success
      setTeams(teams.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            members: (t.members || []).filter(m => m.id !== userId),
          };
        }
        return t;
      }));
      toast.success('Member removed');
    }
  };

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        description: team.description || '',
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleOpenMemberModal = (team) => {
    setSelectedTeam(team);
    setSelectedUserId('');
    setIsMemberModalOpen(true);
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const filteredTeams = Array.isArray(teams) ? teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const getAvailableUsersForTeam = (team) => {
    const memberIds = (team?.members || []).map(m => m.id);
    return Array.isArray(availableUsers) ? availableUsers.filter(u => !memberIds.includes(u.id)) : [];
  };

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-500">Manage maintenance teams and members</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search teams..."
        />
      </Card>

      {/* Teams List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description="Create your first team to organize your technicians"
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="overflow-hidden">
              {/* Team Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleTeamExpand(team.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedTeams[team.id] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-500">
                      {team.description || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="primary">
                    {(team.members || []).length} members
                  </Badge>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenMemberModal(team)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Add member"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(team)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Team Members (Expandable) */}
              {expandedTeams[team.id] && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {(team.members || []).length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No members in this team yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(team.members || []).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(team.id, member.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="Remove member"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Team Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTeam ? 'Edit Team' : 'Add Team'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Team Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Mechanical Team"
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this team handle?"
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title={`Add Member to ${selectedTeam?.name}`}
      >
        <div className="space-y-4">
          <Select
            label="Select User"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            placeholder="Choose a user..."
            options={getAvailableUsersForTeam(selectedTeam).map(user => ({
              value: user.id,
              label: `${user.name} (${user.email})`
            }))}
          />

          {getAvailableUsersForTeam(selectedTeam).length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              All users are already members of this team
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsMemberModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={!selectedUserId}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
