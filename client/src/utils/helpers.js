/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Utility Functions
 * Shared helper functions for the app
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Format time from HH:MM to 12-hour format
 * @param {string} time - Time in HH:MM format
 * @returns {string} - Formatted time (e.g., "9:00 AM")
 */
export function formatTime(time) {
    if (!time) return '';

    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${ampm}`;
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date
 */
export function formatDate(date, options = {}) {
    if (!date) return '';

    const defaultOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
        .format(new Date(date));
}

/**
 * Format date to YYYY-MM-DD for API calls
 * @param {Date} date - Date object
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date) {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Get current day name
 * @returns {string} - Day name (e.g., "Monday")
 */
export function getCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

/**
 * Get current time in HH:MM format
 * @returns {string} - Current time
 */
export function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get days of the week array
 * @returns {string[]} - Array of day names
 */
export function getDaysOfWeek() {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

/**
 * Get attendance status color class
 * @param {number} percentage - Attendance percentage
 * @returns {string} - CSS class name
 */
export function getAttendanceStatusClass(percentage) {
    if (percentage === 100) return 'badge-success';
    if (percentage >= 75) return 'badge-warning';
    return 'badge-danger';
}

/**
 * Get attendance status label
 * @param {number} percentage - Attendance percentage
 * @returns {string} - Status label
 */
export function getAttendanceStatusLabel(percentage) {
    if (percentage === 100) return 'Perfect';
    if (percentage >= 75) return 'Good';
    return 'Critical';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a unique ID (for keys, not cryptographic)
 * @returns {string} - Unique ID
 */
export function generateId() {
    return Math.random().toString(36).substring(2, 11);
}

/**
 * Parse markdown-like text to simple HTML
 * Handles: **bold**, *italic*, - lists, numbered lists
 * @param {string} text - Text to parse
 * @returns {string} - HTML string
 */
export function parseSimpleMarkdown(text) {
    if (!text) return '';

    return text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Trim
        .trim();
}

/**
 * Group array items by a key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key to group by
 * @returns {Object} - Grouped object
 */
export function groupBy(array, key) {
    return array.reduce((acc, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {});
}

/**
 * Check if current time is within a time range
 * @param {string} startTime - Start time in HH:MM
 * @param {string} endTime - End time in HH:MM
 * @returns {boolean}
 */
export function isCurrentTimeInRange(startTime, endTime) {
    const now = getCurrentTime();
    return now >= startTime && now <= endTime;
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatRelativeTime(date) {
    if (!date) return '';

    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return formatDate(date, { month: 'short', day: 'numeric' });
}

export default {
    formatTime,
    formatDate,
    toISODateString,
    getCurrentDay,
    getCurrentTime,
    getDaysOfWeek,
    getAttendanceStatusClass,
    getAttendanceStatusLabel,
    truncateText,
    debounce,
    isValidEmail,
    capitalizeFirst,
    generateId,
    parseSimpleMarkdown,
    groupBy,
    isCurrentTimeInRange,
    formatRelativeTime,
};
