import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  Calendar, 
  Cog, 
  BarChart3, 
  Users,
  UserCog,
  Building2,
  Tags,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Bell,
  Search,
  Factory
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { getNavItems, ROLE_LABELS } from '../../config/constants';
import { Avatar, Dropdown, DropdownItem, DropdownDivider } from '../ui';
import { dashboardAPI } from '../../services/api';

const iconMap = {
  LayoutDashboard,
  Wrench,
  Calendar,
  Cog,
  BarChart3,
  Users,
  UserCog,
  Building2,
  Tags,
  Factory,
};

export function MainLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await dashboardAPI.getNotifications();
      const responseData = response.data.data;
      setNotifications((responseData?.notifications || []).slice(0, 5)); // Show only 5 in dropdown
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const navItems = getNavItems(user?.role);

  const toggleMenu = (name) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'alert': return '🔶';
      case 'success': return '🟢';
      default: return '🔔';
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Cog className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">GearGuard</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center px-6">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon];
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedMenus[item.name];
                const active = isActive(item.path);

                if (hasSubItems) {
                  return (
                    <div key={item.name} className="relative group">
                      <button
                        onMouseEnter={() => setExpandedMenus(prev => ({ ...prev, [item.name]: true }))}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                          transition-all duration-200
                          ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{item.name}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {isExpanded && (
                        <div 
                          className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                          onMouseLeave={() => setExpandedMenus(prev => ({ ...prev, [item.name]: false }))}
                        >
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`
                                block px-4 py-2 text-sm
                                transition-colors duration-200
                                ${isActive(subItem.path) 
                                  ? 'bg-blue-50 text-blue-600 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-100'
                                }
                              `}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                      transition-all duration-200
                      ${active 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notifications */}
              <Dropdown
                align="right"
                trigger={
                  <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                }
              >
                <div className="w-80">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-xs text-blue-600">{unreadCount} new</span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-6 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                            notification.unread ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <p className={`text-sm ${notification.unread ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button 
                      onClick={() => navigate('/notifications')}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              </Dropdown>

              {/* User Dropdown */}
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100">
                    <Avatar name={user?.name || 'User'} size="sm" />
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role]}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden xl:block" />
                  </button>
                }
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <DropdownItem icon={User} onClick={() => navigate('/profile')}>
                  Profile
                </DropdownItem>
                <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
                  Settings
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem icon={LogOut} onClick={handleLogout} danger>
                  Logout
                </DropdownItem>
              </Dropdown>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden border-t border-gray-200 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon];
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedMenus[item.name];
                const active = isActive(item.path);

                if (hasSubItems) {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                          transition-colors duration-200
                          ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {Icon && <Icon className="w-5 h-5" />}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.subItems.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`
                                block px-3 py-2 rounded-lg text-sm
                                transition-colors duration-200
                                ${isActive(subItem.path) 
                                  ? 'bg-blue-50 text-blue-600 font-medium' 
                                  : 'text-gray-600 hover:bg-gray-100'
                                }
                              `}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-colors duration-200
                      ${active 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-[1920px] mx-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}
