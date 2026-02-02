/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Service Module
 * Centralized API calls with authentication and error handling
 * ═══════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

// Base API URL - change this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor - adds auth token to all requests
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(
                `[API] ${config.method?.toUpperCase()} ${config.url}`,
                config.data || ''
            );
        }

        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - handles 401 and logs responses
 */
api.interceptors.response.use(
    (response) => {
        // Log successful response in development
        if (import.meta.env.DEV) {
            console.log(
                `[API] ✓ ${response.config.method?.toUpperCase()} ${response.config.url}`,
                response.data
            );
        }
        return response;
    },
    (error) => {
        const { response } = error;

        // Log error details
        console.error(
            `[API] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
            response?.data || error.message
        );

        // Handle 401 Unauthorized
        if (response?.status === 401) {
            console.warn('[API] Unauthorized - clearing auth and redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('teacher');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// ═══════════════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════════════

export const authAPI = {
    /**
     * Login teacher
     * @param {string} email 
     * @param {string} password 
     */
    login: async (email, password) => {
        console.log('[AUTH] Attempting login for:', email);
        const response = await api.post('/api/auth/login', { email, password });

        if (response.data.success) {
            console.log('[AUTH] Login successful');
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('teacher', JSON.stringify(response.data.teacher));
        }

        return response.data;
    },

    /**
     * Register new teacher
     * @param {string} name 
     * @param {string} email 
     * @param {string} password 
     */
    register: async (name, email, password) => {
        console.log('[AUTH] Attempting registration for:', email);
        const response = await api.post('/api/auth/register', { name, email, password });

        if (response.data.success) {
            console.log('[AUTH] Registration successful');
        }

        return response.data;
    },

    /**
     * Logout - clears local storage
     */
    logout: () => {
        console.log('[AUTH] Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('teacher');
        window.location.href = '/login';
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        return !!token;
    },

    /**
     * Get stored teacher data
     */
    getTeacher: () => {
        const teacher = localStorage.getItem('teacher');
        return teacher ? JSON.parse(teacher) : null;
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSES API
// ═══════════════════════════════════════════════════════════════════════════

export const classesAPI = {
    /**
     * Get all classes for the teacher
     */
    getAll: async () => {
        console.log('[CLASSES] Fetching all classes');
        const response = await api.get('/api/classes');
        return response.data;
    },

    /**
     * Get today's classes
     */
    getToday: async () => {
        console.log('[CLASSES] Fetching today\'s classes');
        const response = await api.get('/api/classes/today');
        return response.data;
    },

    /**
     * Get current running class (based on time)
     */
    getCurrent: async () => {
        console.log('[CLASSES] Checking current class');
        const response = await api.get('/api/classes/current');
        return response.data;
    },

    /**
     * Create a new class
     * @param {Object} classData - { subject, day, startTime, endTime }
     */
    create: async (classData) => {
        console.log('[CLASSES] Creating new class:', classData);
        const response = await api.post('/api/classes', classData);
        return response.data;
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// STUDENTS API
// ═══════════════════════════════════════════════════════════════════════════

export const studentsAPI = {
    /**
     * Get all students for the teacher
     */
    getAll: async () => {
        console.log('[STUDENTS] Fetching all students');
        const response = await api.get('/api/students');
        return response.data;
    },

    /**
     * Add a new student
     * @param {Object} studentData - { name, rollNo }
     */
    create: async (studentData) => {
        console.log('[STUDENTS] Adding new student:', studentData);
        const response = await api.post('/api/students', studentData);
        return response.data;
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE API
// ═══════════════════════════════════════════════════════════════════════════

export const attendanceAPI = {
    /**
     * Mark attendance for a class
     * @param {Object} payload - { class, date, records: [{ student, status }] }
     */
    mark: async (payload) => {
        console.log('[ATTENDANCE] Submitting attendance:', payload);
        const response = await api.post('/api/attendance', payload);
        return response.data;
    },

    /**
     * Get attendance records for a class
     * @param {string} classId 
     */
    getByClass: async (classId) => {
        console.log('[ATTENDANCE] Fetching attendance for class:', classId);
        const response = await api.get(`/api/attendance/class/${classId}`);
        return response.data;
    },

    /**
     * Get analytics for a class
     * @param {string} classId 
     */
    getAnalytics: async (classId) => {
        console.log('[ANALYTICS] Fetching analytics for class:', classId);
        const response = await api.get(`/api/attendance/analytics/${classId}`);
        return response.data;
    },

    /**
     * Get chart data for a specific attendance record
     * @param {string} attendanceId 
     */
    getChartData: async (attendanceId) => {
        console.log('[ANALYTICS] Fetching chart data for attendance:', attendanceId);
        const response = await api.get(`/api/attendance/chart/${attendanceId}`);
        return response.data;
    },

    /**
     * Get AI insights prompt for a class
     * @param {string} classId 
     */
    getAIInsights: async (classId) => {
        console.log('[ANALYTICS] Fetching AI insights for class:', classId);
        const response = await api.get(`/api/attendance/ai-insights/${classId}`);
        return response.data;
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTE: Gemini AI API calls have been moved to the backend for security.
// The AI insights are now fetched via attendanceAPI.getAIInsights()
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

export const healthAPI = {
    /**
     * Check backend health
     */
    check: async () => {
        console.log('[HEALTH] Checking backend status');
        const response = await api.get('/health');
        return response.data;
    },
};

export default api;
