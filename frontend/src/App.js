import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Route - Dashboard (role-based) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardRouter />
            </PrivateRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            <RootRedirect />
          }
        />

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Component to handle root redirect
function RootRedirect() {
  const token = localStorage.getItem('access_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

// Component to route to correct dashboard based on role
function DashboardRouter() {
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  if (userData.role === 'faculty') {
    return <FacultyDashboard />;
  } else if (userData.role === 'student') {
    return <StudentDashboard />;
  }

  // If no valid role, logout and redirect
  localStorage.clear();
  return <Navigate to="/login" replace />;
}

export default App;
