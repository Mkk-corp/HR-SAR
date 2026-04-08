import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import EmployeesPage from './pages/Employees/EmployeesPage';
import EmployeeDetailPage from './pages/Employees/EmployeeDetailPage';
import FacilitiesPage from './pages/Facilities/FacilitiesPage';
import FacilityDetailPage from './pages/Facilities/FacilityDetailPage';
import TransfersPage from './pages/Transfers/TransfersPage';
import UsersPage from './pages/Users/UsersPage';
import RolesPage from './pages/Roles/RolesPage';
import ProfilePage from './pages/Profile/ProfilePage';

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  return isLoggedIn ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><AppLayout><EmployeesPage /></AppLayout></PrivateRoute>} />
      <Route path="/employees/:id" element={<PrivateRoute><AppLayout><EmployeeDetailPage /></AppLayout></PrivateRoute>} />
      <Route path="/facilities" element={<PrivateRoute><AppLayout><FacilitiesPage /></AppLayout></PrivateRoute>} />
      <Route path="/facilities/:id" element={<PrivateRoute><AppLayout><FacilityDetailPage /></AppLayout></PrivateRoute>} />
      <Route path="/transfers" element={<PrivateRoute><AppLayout><TransfersPage /></AppLayout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><AppLayout><UsersPage /></AppLayout></PrivateRoute>} />
      <Route path="/roles" element={<PrivateRoute><AppLayout><RolesPage /></AppLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><AppLayout><ProfilePage /></AppLayout></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
