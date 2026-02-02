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
  const [teacher, setTeacher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    console.log('[AUTH] Checking existing authentication');
    
    const token = localStorage.getItem('token');
    const storedTeacher = localStorage.getItem('teacher');
    
    if (token && storedTeacher) {
      try {
        const parsedTeacher = JSON.parse(storedTeacher);
        setTeacher(parsedTeacher);
        setIsAuthenticated(true);
        console.log('[AUTH] Found existing session for:', parsedTeacher.name);
      } catch (error) {
        console.error('[AUTH] Failed to parse stored teacher data:', error);
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
  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        setTeacher(response.teacher);
        setIsAuthenticated(true);
        console.log('[AUTH] Login state updated for:', response.teacher.name);
        return { success: true };
      } else {
        console.error('[AUTH] Login failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      console.error('[AUTH] Login error:', message);
      return { success: false, message };
    }
  };

  /**
   * Register handler
   */
  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      
      if (response.success) {
        console.log('[AUTH] Registration successful, user can now login');
        return { success: true };
      } else {
        console.error('[AUTH] Registration failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      console.error('[AUTH] Registration error:', message);
      return { success: false, message };
    }
  };

  /**
   * Logout handler
   */
  const logout = () => {
    console.log('[AUTH] Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('teacher');
    setTeacher(null);
    setIsAuthenticated(false);
  };

  // Context value
  const value = {
    teacher,
    isLoading,
    isAuthenticated,
    login,
    register,
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
