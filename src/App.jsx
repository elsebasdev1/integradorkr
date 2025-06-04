import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './contexts/AuthContext';

import Login               from './pages/Login';
import PatientDashboard    from './pages/PatientDashboard';
import AdminDashboard      from './pages/AdminDashboard';
import ScheduleAppointment from './pages/ScheduleAppointment';
import DoctorManagement    from './pages/DoctorManagement';
import UserManagement      from './pages/UserManagement';
import EditProfile         from './pages/PatientEditProfile';

/**
 * Componente que maneja rutas privadas:
 * - Mientras loadingAuth === true (cargando Auth), NO renderiza nada.
 * - Si user === null (no autenticado), redirige a /login.
 * - Si user existe, renderiza children.
 */
function PrivateRoute({ children }) {
  const { user, loadingAuth } = useAuth();

  if (loadingAuth) {
    // Podrías devolver un spinner aquí si quisieras
    return null;
  }
  return user ? children : <Navigate to="/login" replace />;
}

/**
 * Componente que maneja la ruta /login:
 * - Mientras loadingAuth === true, NO renderiza nada (pantalla en blanco).
 * - Si no hay usuario, muestra <Login />.
 * - Si ya hay usuario, redirige según su rol (patient → "/", admin → "/admin").
 */
function LoginRoute() {
  const { user, role, loadingAuth } = useAuth();

  if (loadingAuth) {
    return null; // esperando a Firebase
  }
  if (!user) {
    return <Login />;
  }
  // Si ya está autenticado, redirige según su rol:
  return role === 'admin'
    ? <Navigate to="/admin" replace />
    : <Navigate to="/"      replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        {/* Rutas Privadas */}
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

        {/* Cualquier otra ruta, redirigir a "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
