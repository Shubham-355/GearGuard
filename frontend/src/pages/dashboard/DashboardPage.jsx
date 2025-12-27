import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Users, 
  ClipboardList, 
  Clock,
  TrendingUp,
  ArrowRight,
  Wrench,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronRight,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '../../components/layout';
import { Card, CardHeader, CardContent, Badge, Avatar, Button, Spinner } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { dashboardAPI, requestsAPI } from '../../services/api';
import { STAGE_LABELS, STAGE_COLORS, PRIORITY_COLORS, USER_ROLES } from '../../config/constants';

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, bgColor, textColor, link }) {
  return (
    <Card className={`${bgColor} border-0 relative overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p>
            <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
            <p className={`text-sm ${textColor} opacity-70 mt-1`}>{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg ${textColor} bg-white/20`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {link && (
          <Link 
            to={link} 
            className={`inline-flex items-center gap-1 mt-4 text-sm font-medium ${textColor} hover:underline`}
          >
            View details <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

// Request List Item
function RequestItem({ request }) {
  const priorityDiamonds = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };

  return (
    <Link 
      to={`/maintenance/${request.id}`}
      className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Wrench className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{request.subject}</p>
          <p className="text-sm text-gray-500">
            {request.equipment?.name || 'No equipment'} • {request.createdBy?.name}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-0.5">
          {[...Array(3)].map((_, i) => (
            <span
              key={i}
              className={`text-lg ${i < priorityDiamonds[request.priority] ? PRIORITY_COLORS[request.priority] : 'text-gray-300'}`}
            >
              ◆
            </span>
          ))}
        </div>
        <Badge 
          variant={
            request.stage === 'NEW' ? 'primary' : 
            request.stage === 'IN_PROGRESS' ? 'warning' : 
            request.stage === 'REPAIRED' ? 'success' : 'default'
          }
        >
          {STAGE_LABELS[request.stage]}
        </Badge>
        {request.isOverdue && (
          <Badge variant="danger">Overdue</Badge>
        )}
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, requestsRes] = await Promise.all([
        dashboardAPI.getStats(),
        requestsAPI.getAll({ page: 1, limit: 10 }),
      ]);
      
      // Map backend response to match frontend expectations
      const apiData = statsRes.data.data;
      const mappedStats = {
        criticalEquipment: apiData.equipment?.critical || 0,
        technicianUtilization: apiData.technicians?.utilizationPercentage || 0,
        openRequests: apiData.requests?.open || 0,
        overdueRequests: apiData.requests?.overdue || 0,
        totalEquipment: apiData.equipment?.total || 0,
        totalRequests: apiData.requests?.total || 0,
        completedThisMonth: apiData.requests?.completed || 0,
        newRequests: apiData.requests?.new || 0,
        inProgressRequests: apiData.requests?.inProgress || 0,
        repairedRequests: apiData.requests?.repaired || 0,
        scrapRequests: apiData.requests?.scrap || 0,
      };
      
      setStats(mappedStats);
      
      // Extract requests from paginated response
      const responseData = requestsRes.data.data;
      const requests = Array.isArray(responseData) ? responseData : (responseData?.data || []);
      console.log('Recent requests fetched:', requests); // Debug log
      setRecentRequests(requests);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set mock data for demo
      setStats({
        criticalEquipment: 0,
        technicianUtilization: 0,
        openRequests: 0,
        overdueRequests: 0,
        totalEquipment: 0,
        totalRequests: 0,
        completedThisMonth: 0,
      });
      setRecentRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const canViewFullDashboard = [USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER].includes(user?.role);

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
      {/* Page Header with Search */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          
          {/* Search Bar in Middle */}
          <div className="relative w-full lg:w-96 xl:w-[500px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment, requests, or team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 leading-tight">
              <div>Last updated:</div>
              <div>{format(new Date(), 'MMM d, yyyy h:mm a')}</div>
            </div>
            <Button onClick={() => navigate('/maintenance/new')} size="sm">
              <Wrench className="w-3.5 h-3.5 mr-1.5" />
              New Request
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Critical Equipment"
          value={`${stats?.criticalEquipment || 0} Units`}
          subtitle="Health < 30%"
          icon={AlertTriangle}
          bgColor="bg-gradient-to-br from-red-500 to-red-600"
          textColor="text-white"
          link="/equipment?status=critical"
        />
        
        {canViewFullDashboard && (
          <StatCard
            title="Technician Load"
            value={`${stats?.technicianUtilization || 0}% Utilized`}
            subtitle="Assign Carefully"
            icon={Users}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            textColor="text-white"
            link="/teams"
          />
        )}
        
        <StatCard
          title="Open Requests"
          value={`${stats?.openRequests || 0} Pending`}
          subtitle={`${stats?.overdueRequests || 0} Overdue`}
          icon={ClipboardList}
          bgColor="bg-gradient-to-br from-amber-500 to-orange-500"
          textColor="text-white"
          link="/maintenance"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.totalEquipment || 0}</p>
            <p className="text-sm text-gray-500">Total Equipment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.totalRequests || 0}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.completedThisMonth || 0}</p>
            <p className="text-sm text-gray-500">Completed This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats?.overdueRequests || 0}</p>
            <p className="text-sm text-gray-500">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Requests</h3>
            <Link 
              to="/maintenance" 
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentRequests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentRequests.slice(0, 10).map((request) => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Upcoming */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                to="/maintenance/new" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Request</p>
                  <p className="text-sm text-gray-500">Report a new issue</p>
                </div>
              </Link>
              
              <Link 
                to="/calendar" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Calendar</p>
                  <p className="text-sm text-gray-500">Check scheduled maintenance</p>
                </div>
              </Link>

              {canViewFullDashboard && (
                <Link 
                  to="/reports" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-500">Analytics & insights</p>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Request Status Summary */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Request Status</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm text-gray-600">New</span>
                </div>
                <span className="font-medium">{stats?.newRequests || 4}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-sm text-gray-600">In Progress</span>
                </div>
                <span className="font-medium">{stats?.inProgressRequests || 8}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-600">Repaired</span>
                </div>
                <span className="font-medium">{stats?.repairedRequests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm text-gray-600">Scrap</span>
                </div>
                <span className="font-medium">{stats?.scrapRequests || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  <span className="text-sm text-gray-600">Scrap</span>
                </div>
                <span className="font-medium">{stats?.scrapRequests || 2}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
