import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { MainLayout } from '../components/layout';
import { Card, Spinner, EmptyState, Button } from '../components/ui';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getNotifications();
      const responseData = response.data.data;
      setNotifications(responseData?.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'alert':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'critical': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      case 'alert': return 'border-l-blue-500';
      case 'success': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-6 h-6" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            Stay updated with equipment maintenance and system alerts
          </p>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-600">Loading notifications...</span>
            </div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bell}
              title="No notifications"
              message="You're all caught up! No new notifications at this time."
            />
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  p-6 hover:bg-gray-50 transition-colors border-l-4 cursor-pointer
                  ${getBorderColor(notification.type)}
                  ${notification.unread ? 'bg-blue-50/50' : 'bg-white'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className={`
                          text-sm font-medium
                          ${notification.unread ? 'text-gray-900' : 'text-gray-700'}
                        `}>
                          {notification.title}
                        </h3>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2 ml-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {notification.time}
                        </span>
                        {notification.link && (
                          <div className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                            <span className="text-xs">View details</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button 
              variant="secondary" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Refresh Notifications
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}