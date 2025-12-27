// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MAINTENANCE_MANAGER: 'MAINTENANCE_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  EMPLOYEE: 'EMPLOYEE',
};

// Role Labels
export const ROLE_LABELS = {
  ADMIN: 'Admin',
  MAINTENANCE_MANAGER: 'Maintenance Manager',
  TECHNICIAN: 'Technician',
  EMPLOYEE: 'Employee',
};

// Request Types
export const REQUEST_TYPES = {
  CORRECTIVE: 'CORRECTIVE',
  PREVENTIVE: 'PREVENTIVE',
};

export const REQUEST_TYPE_LABELS = {
  CORRECTIVE: 'Corrective (Breakdown)',
  PREVENTIVE: 'Preventive (Routine)',
};

// Request Stages
export const REQUEST_STAGES = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  REPAIRED: 'REPAIRED',
  SCRAP: 'SCRAP',
};

export const STAGE_LABELS = {
  NEW: 'New Request',
  IN_PROGRESS: 'In Progress',
  REPAIRED: 'Repaired',
  SCRAP: 'Scrap',
};

export const STAGE_COLORS = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REPAIRED: 'bg-green-100 text-green-800 border-green-200',
  SCRAP: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Priority Levels
export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

export const PRIORITY_COLORS = {
  LOW: 'text-green-500',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-red-500',
};

// Equipment Status
export const EQUIPMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
  SCRAPPED: 'SCRAPPED',
};

export const EQUIPMENT_STATUS_LABELS = {
  ACTIVE: 'Active',
  UNDER_MAINTENANCE: 'Under Maintenance',
  SCRAPPED: 'Scrapped',
};

export const EQUIPMENT_STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  SCRAPPED: 'bg-red-100 text-red-800',
};

// Navigation Items by Role
export const getNavItems = (role) => {
  const baseItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Maintenance', path: '/maintenance', icon: 'Wrench' },
    { name: 'Calendar', path: '/calendar', icon: 'Calendar' },
  ];

  const equipmentItems = [
    { 
      name: 'Equipment', 
      path: '/equipment', 
      icon: 'Cog',
      subItems: [
        { name: 'Machines & Tools', path: '/equipment' },
        { name: 'Work Centers', path: '/work-centers' },
      ]
    },
  ];

  const reportingItems = [
    { name: 'Reporting', path: '/reports', icon: 'BarChart3' },
  ];

  const teamItems = [
    { name: 'Teams', path: '/teams', icon: 'Users' },
  ];

  const adminItems = [
    { name: 'Users', path: '/settings/users', icon: 'UserCog' },
    { name: 'Departments', path: '/settings/departments', icon: 'Building2' },
    { name: 'Categories', path: '/settings/categories', icon: 'Tags' },
  ];

  switch (role) {
    case USER_ROLES.ADMIN:
      return [...baseItems, ...equipmentItems, ...reportingItems, ...teamItems, ...adminItems];
    case USER_ROLES.MAINTENANCE_MANAGER:
      return [...baseItems, ...equipmentItems, ...reportingItems, ...teamItems];
    case USER_ROLES.TECHNICIAN:
      return [...baseItems, ...equipmentItems, ...teamItems];
    case USER_ROLES.EMPLOYEE:
      return [
        { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
        { name: 'My Requests', path: '/maintenance', icon: 'Wrench' },
        { name: 'Equipment', path: '/equipment', icon: 'Cog' },
      ];
    default:
      return baseItems;
  }
};
