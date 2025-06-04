import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthProvider, { useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ScheduleAppointment from './pages/ScheduleAppointment';
import DoctorManagement from './pages/DoctorManagement';
import UserManagement from './pages/UserManagement';
import EditProfile from './pages/PatientEditProfile';
import SpecialtyManagement from './pages/SpecialtyManagement';

function PrivateRoute({ children }) {
  const { user, loadingAuth } = useAuth();
  if (loadingAuth) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { user, role, loadingAuth } = useAuth();
  if (loadingAuth) return null;
  return !user
    ? <Login />
    : role === 'admin'
      ? <Navigate to="/admin" replace />
      : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
          },
        }}
      />

      {/* Rutas de la aplicación */}
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <PatientDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <PrivateRoute>
              <DoctorManagement />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <PrivateRoute>
              <ScheduleAppointment />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <EditProfile />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/specialties"
          element={
            <PrivateRoute>
              <SpecialtyManagement />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
