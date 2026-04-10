/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Stuma - Teacher Attendance Tracking System
 * Main Application Component
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ClassesPage from './pages/Classes/ClassesPage';
import StudentsPage from './pages/Students/StudentsPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import VolunteersPage from './pages/Volunteers/VolunteersPage';
import VolunteerSchedulePage from './pages/Classes/VolunteerSchedulePage';
import GalleryPage from './pages/Gallery/GalleryPage';
import ProfilePage from './pages/Profile/ProfilePage';

// Styles
import './index.css';

console.log('[APP] Stuma application initializing...');

/**
 * Root redirect component
 * Redirects to dashboard if authenticated, otherwise to login
 */
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

/**
 * Route protection for admin only views
 */
function AdminRoute({ children }) {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  
  if (currentUser?.role === 'volunteer') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

/**
 * Main App Component
 */
function App() {
  console.log('[APP] Rendering App component');
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/classes" element={<AdminRoute><ClassesPage /></AdminRoute>} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/volunteers" element={<AdminRoute><VolunteersPage /></AdminRoute>} />
              <Route path="/my-schedule" element={<VolunteerSchedulePage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />
            
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
