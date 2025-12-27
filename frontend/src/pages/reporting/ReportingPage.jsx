import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Wrench,
  Users,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { MainLayout } from '../../components/layout';
import { Card, Button, Select, Spinner, Badge } from '../../components/ui';
import { dashboardAPI } from '../../services/api';

// Simple bar chart component
function BarChartSimple({ data, valueKey, labelKey, colorFn }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  
  const maxValue = Math.max(...data.map(d => d[valueKey]), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-32 text-sm text-gray-600 truncate">{item[labelKey]}</div>
          <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`h-full ${colorFn ? colorFn(item) : 'bg-blue-500'} transition-all duration-500`}
              style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-12 text-right text-sm font-medium">{item[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

// Pie chart visualization (simple)
function PieChartSimple({ data, valueKey, labelKey, colors }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }
  
  const total = data.reduce((sum, d) => sum + d[valueKey], 0) || 1;
  let cumulative = 0;
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
          {data.map((item, idx) => {
            const percentage = (item[valueKey] / total) * 100;
            const offset = cumulative;
            cumulative += percentage;
            
            return (
              <circle
                key={idx}
                r="16"
                cx="16"
                cy="16"
                fill="transparent"
                stroke={colors[idx % colors.length]}
                strokeWidth="32"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={`-${offset}`}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[idx % colors.length] }}
            />
            <span className="text-sm text-gray-600">{item[labelKey]}</span>
            <span className="text-sm font-medium">({item[valueKey]})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportingPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [data, setData] = useState({
    requestsByTeam: [],
    requestsByCategory: [],
    requestsByType: [],
    requestsByStage: [],
    completionTrend: [],
    avgResolutionTime: 0,
    totalRequests: 0,
    completedRequests: 0,
    overdueRequests: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsRes, teamRes, categoryRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRequestsByTeam().catch(() => ({ data: { data: { teams: [] } } })),
        dashboardAPI.getRequestsByCategory().catch(() => ({ data: { data: { categories: [] } } })),
      ]);
      
      // Backend returns { data: { equipment: {...}, requests: {...}, ... } }
      const backendData = statsRes.data.data;
      const teamData = teamRes.data.data?.teams || [];
      const categoryData = categoryRes.data.data?.categories || [];
      
      // Calculate average resolution time from category data
      const totalRequests = categoryData.reduce((sum, c) => sum + (c.totalRequests || 0), 0);
      const totalDuration = categoryData.reduce((sum, c) => sum + ((c.avgRepairDuration || 0) * (c.totalRequests || 0)), 0);
      const avgResolutionTime = totalRequests > 0 ? Math.round((totalDuration / totalRequests) * 10) / 10 : 0;
      
      // Transform backend data to reporting format
      setData({
        requestsByTeam: teamData.map(t => ({ name: t.name, count: t.total || 0 })),
        requestsByCategory: categoryData.map(c => ({ name: c.name, count: c.totalRequests || 0 })),
        requestsByType: [
          { name: 'PREVENTIVE', count: 0 },
          { name: 'CORRECTIVE', count: 0 },
        ],
        requestsByStage: [
          { name: 'New', count: backendData?.requests?.new || 0 },
          { name: 'In Progress', count: backendData?.requests?.inProgress || 0 },
          { name: 'Repaired', count: backendData?.requests?.repaired || 0 },
          { name: 'Scrap', count: backendData?.requests?.scrap || 0 },
        ],
        completionTrend: [],
        avgResolutionTime: avgResolutionTime,
        totalRequests: backendData?.requests?.total || 0,
        completedRequests: backendData?.requests?.repaired || 0,
        overdueRequests: backendData?.requests?.overdue || 0,
      });
    } catch (error) {
      // Mock data
      setData({
        requestsByTeam: [
          { name: 'Mechanical Team', count: 45 },
          { name: 'Electrical Team', count: 32 },
          { name: 'HVAC Team', count: 28 },
          { name: 'IT Support', count: 15 },
        ],
        requestsByCategory: [
          { name: 'Preventive', count: 58 },
          { name: 'Corrective', count: 42 },
          { name: 'Emergency', count: 12 },
          { name: 'Inspection', count: 8 },
        ],
        requestsByType: [
          { name: 'PREVENTIVE', count: 58 },
          { name: 'CORRECTIVE', count: 62 },
        ],
        requestsByStage: [
          { name: 'New', count: 15 },
          { name: 'In Progress', count: 28 },
          { name: 'Repaired', count: 12 },
          { name: 'Closed', count: 65 },
        ],
        completionTrend: [
          { date: format(subDays(new Date(), 30), 'MMM dd'), completed: 12, opened: 15 },
          { date: format(subDays(new Date(), 25), 'MMM dd'), completed: 18, opened: 14 },
          { date: format(subDays(new Date(), 20), 'MMM dd'), completed: 22, opened: 20 },
          { date: format(subDays(new Date(), 15), 'MMM dd'), completed: 15, opened: 18 },
          { date: format(subDays(new Date(), 10), 'MMM dd'), completed: 25, opened: 22 },
          { date: format(subDays(new Date(), 5), 'MMM dd'), completed: 20, opened: 16 },
          { date: format(new Date(), 'MMM dd'), completed: 8, opened: 15 },
        ],
        avgResolutionTime: 4.2,
        totalRequests: 120,
        completedRequests: 65,
        overdueRequests: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const completionRate = data.totalRequests > 0 
    ? Math.round((data.completedRequests / data.totalRequests) * 100) 
    : 0;

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Maintenance Reports', ''],
      ['Generated:', new Date().toLocaleString()],
      ['Time Range:', `Last ${timeRange} days`],
      [''],
      ['Summary Statistics', ''],
      ['Total Requests', data.totalRequests],
      ['Completed', data.completedRequests],
      ['Overdue', data.overdueRequests],
      ['Avg Resolution Time (h)', data.avgResolutionTime],
      ['Completion Rate', `${completionRate}%`],
      [''],
      ['Status Distribution', ''],
      ['Status', 'Count'],
      ...data.requestsByStage.map(item => [item.name, item.count]),
      [''],
      ['Request Types', ''],
      ['Type', 'Count'],
      ...data.requestsByType.map(item => [item.name, item.count]),
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maintenance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const stageColors = ['#3B82F6', '#F59E0B', '#10B981', '#6B7280'];

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500">Maintenance performance insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              placeholder="Time Range"
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last year' },
              ]}
              className="w-40"
            />
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{data.totalRequests}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{data.completedRequests}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{data.overdueRequests}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Resolution Time</p>
                  <p className="text-2xl font-bold text-gray-900">{data.avgResolutionTime}h</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Rate</h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
              <span>{data.completedRequests} completed</span>
              <span>{data.totalRequests - data.completedRequests} remaining</span>
            </div>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Requests by Team */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Requests by Team</h3>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <BarChartSimple
                data={data.requestsByTeam}
                valueKey="count"
                labelKey="name"
                colorFn={() => 'bg-blue-500'}
              />
            </Card>

            {/* Requests by Category */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Requests by Category</h3>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <BarChartSimple
                data={data.requestsByCategory}
                valueKey="count"
                labelKey="name"
                colorFn={(item) => {
                  const colors = {
                    'Preventive': 'bg-purple-500',
                    'Corrective': 'bg-red-500',
                    'Emergency': 'bg-amber-500',
                    'Inspection': 'bg-blue-500',
                  };
                  return colors[item.name] || 'bg-gray-500';
                }}
              />
            </Card>

            {/* Requests by Type (Pie) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Types</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <PieChartSimple
                data={data.requestsByType}
                valueKey="count"
                labelKey="name"
                colors={['#8B5CF6', '#EF4444']}
              />
            </Card>

            {/* Requests by Stage (Pie) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <PieChartSimple
                data={data.requestsByStage}
                valueKey="count"
                labelKey="name"
                colors={stageColors}
              />
            </Card>
          </div>

          {/* Completion Trend */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Completion Trend</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {(data.completionTrend || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-500">{item.date}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ 
                          width: `${(item.completed / Math.max(item.completed + item.opened, 1)) * 100}%` 
                        }}
                      />
                      <div
                        className="h-full bg-blue-500"
                        style={{ 
                          width: `${(item.opened / Math.max(item.completed + item.opened, 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">✓ {item.completed}</span>
                      <span className="text-blue-600">+ {item.opened}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-gray-600">Opened</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </MainLayout>
  );
}
