import { useState } from 'react';
import { User, Mail, Building2, Shield, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Card, CardHeader, CardContent, Input, Button, Avatar } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../config/constants';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: API call to update profile
      // await usersAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-500">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              {!isEditing && (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6 mb-6">
              <Avatar name={user?.name} size="xl" />
              <div className="flex-1">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Full Name"
                      icon={User}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                    <Input
                      label="Email"
                      type="email"
                      icon={Mail}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                    <div className="flex gap-3">
                      <Button type="submit">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ name: user?.name || '', email: user?.email || '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-lg text-gray-900 mt-1">{user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg text-gray-900 mt-1">{user?.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900 mt-1">{ROLE_LABELS[user?.role] || user?.role}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="text-gray-900 mt-1">{user?.company?.name || 'N/A'}</p>
                </div>
              </div>

              {user?.team && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Team</label>
                    <p className="text-gray-900 mt-1">{user?.team?.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure</p>
              </div>
              {!isChangingPassword && (
                <Button variant="secondary" size="sm" onClick={() => setIsChangingPassword(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              )}
            </div>
          </CardHeader>
          {isChangingPassword && (
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showPasswords.current ? 'text' : 'password'}
                    icon={Lock}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPasswords.new ? 'text' : 'password'}
                    icon={Lock}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    icon={Lock}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
