/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Auth Context
 * Provides authentication state and methods to the entire app
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides auth state/methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    console.log('[AUTH] Checking existing authentication');
    
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user') || localStorage.getItem('teacher'); // legacy support
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('[AUTH] Found existing session for:', parsedUser.name);
      } catch (error) {
        console.error('[AUTH] Failed to parse stored user data:', error);
        logout();
      }
    } else {
      console.log('[AUTH] No existing session found');
    }
    
    setIsLoading(false);
  }, []);

  /**
   * Login handler
   */
  const login = async (email, password, role) => {
    try {
      const response = await authAPI.login(email, password, role);
      
      if (response.success) {
        setUser(response.user || response.teacher);
        setIsAuthenticated(true);
        console.log('[AUTH] Login state updated for:', (response.user || response.teacher).name);
        return { success: true };
      } else {
        console.error('[AUTH] Login failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      let message = error.response?.data?.message || 'Login failed. Please try again.';
      
      // Extract specific validation messages if available
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        message = error.response.data.errors[0].msg;
      }
      
      console.error('[AUTH] Login error:', message);
      return { success: false, message };
    }
  };

  /**
   * Logout handler
   */
  const logout = () => {
    console.log('[AUTH] Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('teacher');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Context value
  const value = {
    user,
    teacher: user, // Alias for older components not yet updated
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
