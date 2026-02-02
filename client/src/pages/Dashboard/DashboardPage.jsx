/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Dashboard Page - Teacher's Calm Control Room
 * Main landing page showing current class, stats island, and guided actions
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classesAPI, studentsAPI } from '../../services/api';
import { formatTime, formatDate, getCurrentDay } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Alert from '../../components/ui/Alert';
import boardBg from '../../assets/homepage/board.jpg';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentClass, setCurrentClass] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    console.log('[DASHBOARD] Loading dashboard data');
    setIsLoading(true);
    setError('');

    try {
      const [currentRes, todayRes, allClassesRes, studentsRes] = await Promise.all([
        classesAPI.getCurrent(),
        classesAPI.getToday(),
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      console.log('[DASHBOARD] Current class:', currentRes.currentClass);
      console.log('[DASHBOARD] Today classes:', todayRes.classes?.length);
      console.log('[DASHBOARD] All classes:', allClassesRes.classes?.length);
      console.log('[DASHBOARD] Students:', studentsRes.count);

      setCurrentClass(currentRes.currentClass || null);
      setTodayClasses(todayRes.classes || []);
      setAllClasses(allClassesRes.classes || []);
      setStudentCount(studentsRes.count || 0);
    } catch (err) {
      console.error('[DASHBOARD] Failed to load data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    }

    setIsLoading(false);
  };

  const handleMarkAttendance = () => {
    if (currentClass) {
      navigate(`/attendance?classId=${currentClass._id}`);
    } else {
      navigate('/attendance');
    }
  };

  // Get teacher image dynamically - uses teacher name as filename
  const getTeacherImage = (name) => {
    if (!name) return null;
    try {
      // Use dynamic import for teacher images
      return new URL(`../../assets/teacher/${name}.png`, import.meta.url).href;
    } catch {
      return null;
    }
  };

  // Timeline slots for empty schedule
  const timelineSlots = ['09:00', '11:00', '14:00', '16:00'];

  if (isLoading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div style={styles.container}>
      {/* Decorative SVG Overlays */}
      <div style={styles.decorativeOverlay}>
        <svg style={styles.decorSvg1} viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 6" />
        </svg>
        <div style={styles.decorDots}></div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* ═══════════════════════════════════════════════════════════════════
          BLACKBOARD SECTION - Teacher Profile on the Board
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={styles.blackboardSection}>
        {/* Blackboard Background */}
        <div style={styles.blackboardBg}></div>
        
        {/* Content written on the board */}
        <div style={styles.blackboardContent}>
          {/* Left side - Faculty Photo (outside the board, like standing next to it) */}
          <div style={styles.teacherPhotoWrapper}>
            <img 
              src={getTeacherImage(teacher?.name)}
              alt={teacher?.name || 'Faculty'}
              style={styles.teacherPhoto}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{...styles.teacherPhotoFallback, display: 'none'}}>
              {teacher?.name?.charAt(0) || 'T'}
            </div>
          </div>

          {/* Right side - Chalk-style info on the board */}
          <div style={styles.chalkContent}>
            {/* Greeting - handwritten style */}
            <p style={styles.chalkGreeting}>Good {getTimeOfDay()}!</p>
            
            {/* Teacher Name - Large chalk text */}
            <h1 style={styles.chalkName}>{teacher?.name || 'Teacher'}</h1>
            
            {/* Chalk underline */}
            <div style={styles.chalkUnderline}></div>
            
            {/* Role & Email */}
            <p style={styles.chalkRole}>
              ✦ Faculty Member
            </p>
            <p style={styles.chalkEmail}>{teacher?.email || ''}</p>

            {/* Stats written on board */}
            <div style={styles.chalkStats}>
              <div style={styles.chalkStatItem}>
                <span style={styles.chalkStatNumber}>{todayClasses.length}</span>
                <span style={styles.chalkStatLabel}>Today</span>
              </div>
              <div style={styles.chalkDivider}>|</div>
              <div style={styles.chalkStatItem}>
                <span style={styles.chalkStatNumber}>{allClasses.length}</span>
                <span style={styles.chalkStatLabel}>Classes</span>
              </div>
              <div style={styles.chalkDivider}>|</div>
              <div style={styles.chalkStatItem}>
                <span style={styles.chalkStatNumber}>{studentCount}</span>
                <span style={styles.chalkStatLabel}>Students</span>
              </div>
            </div>

            {/* Date in corner - like written on board */}
            <div style={styles.chalkDate}>
              <span style={styles.chalkDay}>{getCurrentDay()}</span>
              <span style={styles.chalkFullDate}>{formatDate(new Date(), { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Live Class Notification - overlaid on board corner */}
        {currentClass && (
          <div style={styles.liveClassBadge}>
            <div style={styles.liveDot}></div>
            <span>LIVE: {currentClass.subject}</span>
            <button style={styles.liveBtn} onClick={handleMarkAttendance}>
              Mark Attendance →
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS ISLAND - Redesigned with varied shapes and colors
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={styles.statsIsland}>
        <div style={styles.statsIslandInner}>
          {/* Total Classes - Large wide tile */}
          <div 
            style={styles.statTileClasses}
            onClick={() => navigate('/classes')}
          >
            <div style={styles.statTileIcon}>
              <svg viewBox="0 0 24 24" fill="none" style={{width: '24px', height: '24px'}}>
                <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.8"/>
                <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            <div style={styles.statTileContent}>
              <span style={styles.statTileValue}>{allClasses.length}</span>
              <span style={styles.statTileLabel}>Total Classes</span>
            </div>
            <div style={styles.statTileArrow}>→</div>
          </div>

          {/* Students - Tall tile */}
          <div 
            style={styles.statTileStudents}
            onClick={() => navigate('/students')}
          >
            <div style={styles.statTileIconLarge}>
              <svg viewBox="0 0 32 32" fill="none" style={{width: '32px', height: '32px'}}>
                <circle cx="16" cy="10" r="6" fill="currentColor" opacity="0.9"/>
                <circle cx="8" cy="12" r="4" fill="currentColor" opacity="0.5"/>
                <circle cx="24" cy="12" r="4" fill="currentColor" opacity="0.5"/>
                <path d="M16 18C10 18 5 22 5 28H27C27 22 22 18 16 18Z" fill="currentColor" opacity="0.7"/>
              </svg>
            </div>
            <span style={styles.statTileValueLarge}>{studentCount}</span>
            <span style={styles.statTileLabelLight}>Students Enrolled</span>
          </div>

          {/* Today's Classes - Circle tile */}
          <div style={styles.statTileToday}>
            <div style={styles.statCircleOuter}>
              <div style={styles.statCircleInner}>
                <span style={styles.statCircleValue}>{todayClasses.length}</span>
              </div>
            </div>
            <span style={styles.statTileLabelSmall}>Classes Today</span>
          </div>

          {/* Current Day - Pill tile */}
          <div style={styles.statTileDay}>
            <div style={styles.dayIconWrapper}>
              <svg viewBox="0 0 24 24" fill="none" style={{width: '20px', height: '20px'}}>
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={styles.dayContent}>
              <span style={styles.dayValue}>{getCurrentDay()}</span>
              <span style={styles.dayLabel}>{formatDate(new Date(), { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div style={styles.scheduleCard}>
        <div style={styles.scheduleHeader}>
          <h3 style={styles.scheduleTitle}>Today's Schedule</h3>
          <Link to="/classes" style={styles.scheduleViewAll}>View All →</Link>
        </div>
        
        {todayClasses.length === 0 ? (
          <div style={styles.timelineEmpty}>
            <div style={styles.timelinePlaceholder}>
              {timelineSlots.map((time) => (
                <div key={time} style={styles.timelineSlot}>
                  <span style={styles.timelineTime}>{time}</span>
                  <div style={styles.timelineLine}></div>
                </div>
              ))}
            </div>
            <div style={styles.timelineMessage}>
              <p style={styles.timelineEmptyText}>No classes scheduled for today</p>
              <Link to="/classes" style={styles.timelineAddBtn}>+ Add a Class</Link>
            </div>
          </div>
        ) : (
          <div style={styles.scheduleList}>
            {todayClasses
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((cls, index) => (
                <div 
                  key={cls._id} 
                  style={{
                    ...styles.scheduleItem,
                    ...(currentClass?._id === cls._id && styles.scheduleItemLive),
                  }}
                >
                  <div style={styles.scheduleTimeBlock}>
                    <span style={styles.scheduleStartTime}>{formatTime(cls.startTime)}</span>
                    <div style={styles.scheduleTimeDivider}></div>
                    <span style={styles.scheduleEndTime}>{formatTime(cls.endTime)}</span>
                  </div>
                  <div style={styles.scheduleInfo}>
                    <span style={styles.scheduleSubject}>{cls.subject}</span>
                    {currentClass?._id === cls._id && (
                      <span style={styles.scheduleLiveBadge}>● Live</span>
                    )}
                  </div>
                  <Link to={`/attendance?classId=${cls._id}`} style={styles.scheduleAction}>
                    Attendance →
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Guided Actions */}
      <div style={styles.actionsGrid}>
        <Link to="/attendance" style={styles.actionCard}>
          <div style={{...styles.actionIconWrapper, background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'}}>
            <span style={{...styles.actionIcon, color: '#22C55E'}}>◧</span>
          </div>
          <div style={styles.actionContent}>
            <h4 style={styles.actionTitle}>Mark Attendance</h4>
            <p style={styles.actionDesc}>Record student presence for a class</p>
          </div>
        </Link>

        <Link to="/students" style={{...styles.actionCard, ...styles.actionCardPrimary}}>
          <div style={styles.actionBadge}>Most teachers start here</div>
          <div style={{...styles.actionIconWrapper, background: 'linear-gradient(135deg, rgba(9, 65, 109, 0.2) 0%, rgba(9, 65, 109, 0.08) 100%)'}}>
            <span style={styles.actionIcon}>◎</span>
          </div>
          <div style={styles.actionContent}>
            <h4 style={styles.actionTitle}>Manage Students</h4>
            <p style={styles.actionDesc}>Add or view your students list</p>
          </div>
        </Link>

        <Link to="/analytics" style={styles.actionCard}>
          <div style={{...styles.actionIconWrapper, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'}}>
            <span style={{...styles.actionIcon, color: '#F59E0B'}}>◈</span>
          </div>
          <div style={styles.actionContent}>
            <h4 style={styles.actionTitle}>View Analytics</h4>
            <p style={styles.actionDesc}>Attendance trends and insights</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = {
  container: {
    position: 'relative',
    minHeight: '100%',
  },

  // Decorative Overlays
  decorativeOverlay: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  decorSvg1: {
    position: 'absolute',
    top: '-5%',
    right: '-5%',
    width: '350px',
    height: '350px',
    color: 'rgba(9, 65, 109, 0.04)',
  },
  decorDots: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '150px',
    height: '150px',
    backgroundImage: 'radial-gradient(circle, rgba(187,187,227,0.15) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },

  // ═══════════════════════════════════════════════════════════════════
  // BLACKBOARD SECTION - Chalk-style design
  // ═══════════════════════════════════════════════════════════════════
  blackboardSection: {
    position: 'relative',
    marginBottom: '24px',
    borderRadius: '8px',
    overflow: 'visible',
  },
  blackboardBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${boardBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '8px',
  },
  blackboardContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    padding: '40px 50px',
    minHeight: '280px',
  },

  // Teacher Photo - positioned prominently
  teacherPhotoWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  teacherPhoto: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '5px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  teacherPhotoFallback: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #09416D 0%, #0D5A8C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '3.5rem',
    fontWeight: 700,
    border: '5px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },

  // Chalk-style text content
  chalkContent: {
    flex: 1,
    paddingRight: '20px',
  },
  chalkGreeting: {
    fontSize: '1.125rem',
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: 400,
    margin: '0 0 4px 0',
    fontStyle: 'italic',
    letterSpacing: '0.5px',
  },
  chalkName: {
    fontSize: '2.75rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.95)',
    margin: '0 0 8px 0',
    letterSpacing: '1px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
  },
  chalkUnderline: {
    width: '180px',
    height: '3px',
    background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 70%, transparent 100%)',
    marginBottom: '16px',
    borderRadius: '2px',
  },
  chalkRole: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.85)',
    margin: '0 0 4px 0',
    fontWeight: 500,
    letterSpacing: '0.5px',
  },
  chalkEmail: {
    fontSize: '0.9375rem',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 24px 0',
  },

  // Stats in chalk style
  chalkStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  chalkStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  chalkStatNumber: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 1,
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
  },
  chalkStatLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '4px',
  },
  chalkDivider: {
    fontSize: '1.5rem',
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: 300,
  },

  // Date in corner
  chalkDate: {
    position: 'absolute',
    top: '30px',
    right: '40px',
    textAlign: 'right',
  },
  chalkDay: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
  },
  chalkFullDate: {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Live class badge
  liveClassBadge: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    background: 'rgba(34, 197, 94, 0.95)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
    zIndex: 2,
  },
  liveDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'white',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  liveBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.8125rem',
    cursor: 'pointer',
    marginLeft: '8px',
  },

  // Keep old welcome styles for compatibility
  welcomeGreeting: {
    fontSize: '0.9375rem',
    color: '#374151',
    fontWeight: 500,
  },
  
  // Faculty Profile Card
  facultyCard: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    padding: '28px 32px',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(9, 65, 109, 0.12)',
  },
  facultyImageWrapper: {
    position: 'relative',
    width: '120px',
    height: '120px',
    flexShrink: 0,
  },
  facultyImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #DBFCFF',
    boxShadow: '0 6px 24px rgba(9, 65, 109, 0.2)',
  },
  facultyImageFallback: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #09416D 0%, #0D5A8C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '2rem',
    fontWeight: 700,
  },
  facultyInfo: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontWeight: 500,
  },
  facultyName: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#09416D',
    margin: '2px 0 8px 0',
  },
  facultyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  facultyRole: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: '#DBFCFF',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#09416D',
  },
  roleIcon: {
    fontSize: '0.625rem',
  },
  facultyEmail: {
    fontSize: '0.8125rem',
    color: '#6B7280',
  },
  quickStats: {
    display: 'flex',
    gap: '24px',
  },
  quickStat: {
    display: 'flex',
    flexDirection: 'column',
  },
  quickStatValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#09416D',
    lineHeight: 1,
  },
  quickStatLabel: {
    fontSize: '0.6875rem',
    color: '#9CA3AF',
    fontWeight: 500,
    marginTop: '2px',
  },
  dateDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    textAlign: 'right',
  },
  dateDayName: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#09416D',
  },
  dateFullDate: {
    fontSize: '0.8125rem',
    color: '#6B7280',
    maxWidth: '180px',
  },

  // Live Class Card
  liveClassCard: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(16px)',
    borderRadius: '20px',
    padding: '28px 32px',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.1)',
  },
  liveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22C55E',
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.5)',
  },
  liveText: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#22C55E',
    letterSpacing: '0.08em',
  },
  liveClassName: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#09416D',
    margin: '0 0 6px 0',
  },
  liveClassTime: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: '0 0 20px 0',
  },
  liveActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },

  // Idle State
  idleStateCard: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(16px)',
    borderRadius: '20px',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  idleIconWrapper: {
    position: 'relative',
    display: 'inline-flex',
    marginBottom: '20px',
  },
  idleIcon: {
    width: '72px',
    height: '72px',
    color: '#09416D',
  },
  idleIconGlow: {
    position: 'absolute',
    inset: '-20%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(187, 187, 227, 0.4) 0%, transparent 70%)',
    zIndex: -1,
  },
  idleTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 8px 0',
  },
  idleSubtitle: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: '0 0 24px 0',
  },
  idleActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },

  // Buttons
  primaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #09416D 0%, #0A5A94 100%)',
    color: 'white',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(9, 65, 109, 0.3)',
    transition: 'all 0.2s ease',
  },
  secondaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 24px',
    background: 'transparent',
    color: '#09416D',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    textDecoration: 'none',
    border: '2px solid rgba(9, 65, 109, 0.2)',
    transition: 'all 0.2s ease',
  },
  ghostActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 24px',
    background: 'transparent',
    color: '#6B7280',
    borderRadius: '12px',
    fontWeight: 500,
    fontSize: '0.9375rem',
    textDecoration: 'none',
    border: 'none',
    transition: 'all 0.2s ease',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS ISLAND - New Island Design
  // ═══════════════════════════════════════════════════════════════════════════
  statsIsland: {
    background: 'linear-gradient(135deg, rgba(230, 240, 250, 0.9) 0%, rgba(240, 245, 255, 0.95) 50%, rgba(235, 242, 252, 0.9) 100%)',
    borderRadius: '28px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 8px 40px rgba(9, 65, 109, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(9, 65, 109, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  statsIslandInner: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 0.8fr 1.2fr',
    gridTemplateRows: 'auto',
    gap: '16px',
    alignItems: 'stretch',
  },

  // Total Classes - Wide horizontal tile (Deep Blue)
  statTileClasses: {
    background: 'linear-gradient(135deg, #09416D 0%, #0D5A8C 100%)',
    borderRadius: '20px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(9, 65, 109, 0.3)',
  },
  statTileIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  statTileContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  statTileValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'white',
    lineHeight: 1,
  },
  statTileLabel: {
    fontSize: '0.8125rem',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: 500,
    marginTop: '4px',
  },
  statTileArrow: {
    fontSize: '1.25rem',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Students - Tall tile (Navbar Blue - consistent with theme)
  statTileStudents: {
    background: 'linear-gradient(180deg, #DBFCFF 0%, #A8E8EF 100%)',
    borderRadius: '20px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(9, 65, 109, 0.15)',
    minHeight: '140px',
    border: '1px solid rgba(9, 65, 109, 0.1)',
  },
  statTileIconLarge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(9, 65, 109, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#09416D',
    marginBottom: '12px',
  },
  statTileValueLarge: {
    fontSize: '2.25rem',
    fontWeight: 700,
    color: '#09416D',
    lineHeight: 1,
  },
  statTileLabelLight: {
    fontSize: '0.75rem',
    color: '#09416D',
    fontWeight: 500,
    marginTop: '6px',
    opacity: 0.7,
  },

  // Today - Circle accent tile (Light Blue)
  statTileToday: {
    background: 'linear-gradient(135deg, #E8F4FD 0%, #D0E8F9 100%)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(9, 65, 109, 0.1)',
    border: '1px solid rgba(9, 65, 109, 0.1)',
  },
  statCircleOuter: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: 'rgba(9, 65, 109, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  statCircleInner: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(9, 65, 109, 0.15)',
  },
  statCircleValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#09416D',
  },
  statTileLabelSmall: {
    fontSize: '0.6875rem',
    color: '#09416D',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  // Day - Pill shaped tile (Slate/Gray with Blue accent)
  statTileDay: {
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    borderRadius: '20px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 8px 24px rgba(9, 65, 109, 0.08)',
    border: '1px solid rgba(9, 65, 109, 0.08)',
  },
  dayIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(9, 65, 109, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#09416D',
  },
  dayContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  dayValue: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#09416D',
    lineHeight: 1.2,
  },
  dayLabel: {
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: 500,
  },

  // Schedule Card
  scheduleCard: {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '20px',
    padding: '24px 28px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(9, 65, 109, 0.06)',
  },
  scheduleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  scheduleTitle: {
    fontSize: '1.0625rem',
    fontWeight: 600,
    color: '#1F2937',
    margin: 0,
  },
  scheduleViewAll: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#6B7280',
    textDecoration: 'none',
  },
  timelineEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
  },
  timelinePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    opacity: 0.4,
  },
  timelineSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  timelineTime: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#6B7280',
    fontFamily: 'monospace',
    width: '45px',
  },
  timelineLine: {
    height: '2px',
    width: '100px',
    background: 'linear-gradient(90deg, #B4B8C5 0%, transparent 100%)',
    borderRadius: '2px',
  },
  timelineMessage: {
    flex: 1,
    textAlign: 'center',
    padding: '20px',
  },
  timelineEmptyText: {
    fontSize: '0.9375rem',
    color: '#6B7280',
    margin: '0 0 16px 0',
  },
  timelineAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: 'rgba(9, 65, 109, 0.08)',
    color: '#09416D',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px 20px',
    background: 'rgba(180, 184, 197, 0.08)',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  },
  scheduleItemLive: {
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
  },
  scheduleTimeBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
  },
  scheduleStartTime: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#09416D',
  },
  scheduleTimeDivider: {
    width: '1px',
    height: '12px',
    background: '#B4B8C5',
    margin: '4px 0',
  },
  scheduleEndTime: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  scheduleInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  scheduleSubject: {
    fontWeight: 600,
    fontSize: '0.9375rem',
    color: '#1F2937',
  },
  scheduleLiveBadge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#22C55E',
  },
  scheduleAction: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#6B7280',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.6)',
  },

  // Guided Actions
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  actionCard: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '20px',
    padding: '28px 24px',
    textDecoration: 'none',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    boxShadow: '0 8px 32px rgba(9, 65, 109, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actionCardPrimary: {
    background: 'linear-gradient(135deg, rgba(9, 65, 109, 0.08), rgba(187, 190, 227, 0.18))',
    border: '1px solid rgba(9, 65, 109, 0.15)',
  },
  actionBadge: {
    position: 'absolute',
    top: '-10px',
    left: '24px',
    background: 'linear-gradient(135deg, #09416D 0%, #0A5A94 100%)',
    color: 'white',
    fontSize: '0.6875rem',
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(9, 65, 109, 0.25)',
  },
  actionIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'rgba(9, 65, 109, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: '1.375rem',
    color: '#09416D',
  },
  actionContent: {},
  actionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1F2937',
    margin: '0 0 4px 0',
  },
  actionDesc: {
    fontSize: '0.8125rem',
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.4,
  },
};
