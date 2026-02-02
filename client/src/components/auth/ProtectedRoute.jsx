/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Protected Route Component
 * Wraps routes that require authentication
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[AUTH] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
}
