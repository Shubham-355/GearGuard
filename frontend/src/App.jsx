import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage, RegisterPage, RegisterCompanyPage } from './pages/auth';

// Dashboard
import { DashboardPage } from './pages/dashboard';

// Maintenance
import { MaintenancePage, RequestFormPage, RequestDetailPage } from './pages/maintenance';

// Equipment
import { EquipmentPage, EquipmentFormPage, EquipmentDetailPage, WorkCentersPage } from './pages/equipment';

// Calendar
import { CalendarPage } from './pages/calendar';

// Teams
import { TeamsPage } from './pages/teams';

// Reporting
import { ReportingPage } from './pages/reporting';

// Settings
import { CategoriesPage, DepartmentsPage, UsersPage } from './pages/settings';

// Notifications
import { NotificationsPage } from './pages/NotificationsPage';

// Constants
import { USER_ROLES } from './config/constants';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/company" element={<RegisterCompanyPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Maintenance Routes */}
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <MaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/new"
          element={
            <ProtectedRoute>
              <RequestFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/:id"
          element={
            <ProtectedRoute>
              <RequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/:id/edit"
          element={
            <ProtectedRoute>
              <RequestFormPage />
            </ProtectedRoute>
          }
        />

        {/* Equipment Routes */}
        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <EquipmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/new"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER]}>
              <EquipmentFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/:id"
          element={
            <ProtectedRoute>
              <EquipmentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER]}>
              <EquipmentFormPage />
            </ProtectedRoute>
          }
        />

        {/* Work Centers */}
        <Route
          path="/work-centers"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER]}>
              <WorkCentersPage />
            </ProtectedRoute>
          }
        />

        {/* Calendar */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Teams */}
        <Route
          path="/teams"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER]}>
              <TeamsPage />
            </ProtectedRoute>
          }
        />

        {/* Reporting */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER]}>
              <ReportingPage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Categories */}
        <Route
          path="/settings/categories"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.MAINTENANCE_MANAGER]}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Departments */}
        <Route
          path="/settings/departments"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings - Users */}
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
