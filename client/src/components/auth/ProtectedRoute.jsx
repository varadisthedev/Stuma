/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Protected Route Component
 * Wraps routes that require authentication
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DashboardSkeleton } from '../ui/Skeleton';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div style={{ padding: '24px 32px' }}>
        <DashboardSkeleton />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[AUTH] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
}
