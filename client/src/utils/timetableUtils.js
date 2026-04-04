/**
 * Shared timetable utilities: Indian holidays, current-day/time highlighting
 */

// Indian public holidays for 2025-2026 (YYYY-MM-DD)
export const INDIAN_HOLIDAYS = {
  '2025-01-26': { name: 'Republic Day', emoji: '🇮🇳' },
  '2025-03-14': { name: 'Holi', emoji: '🎨' },
  '2025-03-31': { name: 'Id-ul-Fitr (Eid)', emoji: '🌙' },
  '2025-04-14': { name: 'Ambedkar Jayanti', emoji: '📿' },
  '2025-04-18': { name: 'Good Friday', emoji: '✝️' },
  '2025-05-12': { name: 'Buddha Purnima', emoji: '☸️' },
  '2025-06-07': { name: 'Id-ul-Adha (Bakrid)', emoji: '🌙' },
  '2025-07-06': { name: 'Muharram', emoji: '🌙' },
  '2025-08-15': { name: 'Independence Day', emoji: '🇮🇳' },
  '2025-08-16': { name: 'Janmashtami', emoji: '🪷' },
  '2025-09-05': { name: 'Milad-un-Nabi', emoji: '🌙' },
  '2025-10-02': { name: 'Gandhi Jayanti', emoji: '🕊️' },
  '2025-10-02': { name: 'Dussehra', emoji: '🏹' },
  '2025-10-20': { name: 'Diwali', emoji: '🪔' },
  '2025-10-21': { name: 'Diwali (Laxmi Puja)', emoji: '🪔' },
  '2025-11-05': { name: 'Guru Nanak Jayanti', emoji: '☬' },
  '2025-12-25': { name: 'Christmas', emoji: '🎄' },
  '2026-01-26': { name: 'Republic Day', emoji: '🇮🇳' },
  '2026-03-03': { name: 'Maha Shivratri', emoji: '🔱' },
  '2026-03-20': { name: 'Holi', emoji: '🎨' },
  '2026-04-03': { name: 'Good Friday', emoji: '✝️' },
  '2026-04-14': { name: 'Ambedkar Jayanti / Tamil New Year', emoji: '📿' },
  '2026-05-01': { name: 'Maharashtra Day / Labour Day', emoji: '🏗️' },
  '2026-08-15': { name: 'Independence Day', emoji: '🇮🇳' },
  '2026-10-02': { name: 'Gandhi Jayanti', emoji: '🕊️' },
  '2026-12-25': { name: 'Christmas', emoji: '🎄' },
};

/**
 * Returns the holiday on a given YYYY-MM-DD date, or null.
 */
export function getHoliday(dateStr) {
  return INDIAN_HOLIDAYS[dateStr] || null;
}

/**
 * Checks if a class time slot is currently active.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} startTime - HH:MM
 * @param {string} endTime   - HH:MM
 * @param {Date} [nowObj]    - Optional current date object (defaults to new Date())
 */
export function isCurrentSlot(dateStr, startTime, endTime, nowObj = new Date()) {
  // Use local timezone to determine the current YYYY-MM-DD
  const year = nowObj.getFullYear();
  const month = String(nowObj.getMonth() + 1).padStart(2, '0');
  const day = String(nowObj.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (dateStr !== todayStr) return false;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const start = new Date(nowObj);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(nowObj);
  end.setHours(eh, em, 0, 0);

  return nowObj >= start && nowObj <= end;
}

/**
 * Returns a locale-formatted "time range" string for display.
 */
export function formatTimeRange(start, end) {
  const fmt = t => {
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}
