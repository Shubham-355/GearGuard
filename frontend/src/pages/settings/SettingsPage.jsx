import { useNavigate } from 'react-router-dom';
import { Tag, Building2, Users, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Card, CardHeader, CardContent } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { USER_ROLES } from '../../config/constants';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isManager = [USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER].includes(user?.role);

  const settingsOptions = [
    {
      id: 'company',
      title: 'Company Settings',
      description: 'Manage company information and email domains',
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      path: '/settings/company',
      allowedRoles: [USER_ROLES.ADMIN],
    },
    {
      id: 'categories',
      title: 'Categories',
      description: 'Manage equipment and maintenance categories',
      icon: Tag,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      path: '/settings/categories',
      allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER],
    },
    {
      id: 'departments',
      title: 'Departments',
      description: 'Manage company departments and organizational structure',
      icon: Building2,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      path: '/settings/departments',
      allowedRoles: [USER_ROLES.ADMIN],
    },
    {
      id: 'users',
      title: 'Users',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      path: '/settings/users',
      allowedRoles: [USER_ROLES.ADMIN],
    },
  ];

  const filteredOptions = settingsOptions.filter(option => 
    option.allowedRoles.includes(user?.role)
  );

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your application configuration</p>
            </div>
          </div>
        </div>

        {/* Settings Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${option.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${option.iconColor}`} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Box */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Access Control</h4>
                <p className="text-sm text-blue-800">
                  Some settings are restricted based on your role. Contact your administrator if you need access to additional settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
