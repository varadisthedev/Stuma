/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Analytics Page - Clean & Readable Design
 * View attendance statistics, charts, and AI-powered insights
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { classesAPI, attendanceAPI } from '../../services/api';
import { formatTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

// Clean color palette
const COLORS = {
  primary: '#09416D',
  accent: '#DBFCFF',
  accentBorder: '#A8E8EF',
  gray100: '#F8FAFC',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#1F2937',
  white: '#FFFFFF',
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');

  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  const [aiInsights, setAiInsights] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    critical: false,
    good: false,
    perfect: false,
  });

  const [selectedSection, setSelectedSection] = useState('all');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadAnalytics(selectedClassId);
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const response = await classesAPI.getAll();
      setClasses(response.classes || []);
      if (preselectedClassId) {
        setSelectedClassId(preselectedClassId);
      } else if (response.classes?.length === 1) {
        setSelectedClassId(response.classes[0]._id);
      }
    } catch (err) {
      setError('Failed to load classes');
    }
    setIsLoading(false);
  };

  const loadAnalytics = async (classId) => {
    setAnalytics(null);
    setAiInsights('');
    setError('');
    try {
      const response = await attendanceAPI.getAnalytics(classId);
      setAnalytics(response);
    } catch (err) {
      setError('Failed to load analytics');
    }
  };

  const loadAIInsights = async () => {
    if (!selectedClassId) return;
    setIsLoadingAI(true);
    setAiError('');
    try {
      // Backend now handles the Gemini API call and returns the AI response
      const insightsResponse = await attendanceAPI.getAIInsights(selectedClassId);
      if (insightsResponse.success && insightsResponse.text) {
        setAiInsights(insightsResponse.text);
      } else {
        setAiError(insightsResponse.message || 'Failed to get AI insights');
      }
    } catch (err) {
      setAiError('Failed to get AI insights');
    }
    setIsLoadingAI(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  const getAvailableSections = () => {
    if (!analytics?.stats) return [];
    const sections = new Set();
    analytics.stats.forEach(s => {
      const match = s.rollNo?.match(/^(B\d)/i);
      if (match) sections.add(match[1].toUpperCase());
    });
    return Array.from(sections).sort();
  };

  const filterBySection = (students) => {
    if (selectedSection === 'all') return students;
    return students?.filter(s => {
      const match = s.rollNo?.match(/^(B\d)/i);
      return match && match[1].toUpperCase() === selectedSection;
    });
  };

  // Doughnut chart - simple and clean
  const getChartData = () => {
    if (!analytics?.categories) return null;
    const perfect = analytics.categories.perfect.count;
    const good = analytics.categories.above75.count;
    const critical = analytics.categories.critical.count;
    const total = perfect + good + critical;
    
    if (total === 0) return null;

    return {
      labels: ['Perfect (100%)', 'Good (75-99%)', 'Critical (<75%)'],
      datasets: [{
        data: [perfect, good, critical],
        backgroundColor: [COLORS.primary, COLORS.accentBorder, COLORS.gray300],
        borderWidth: 0,
        cutout: '65%',
      }],
    };
  };

  // Distribution chart - shows how many students fall into each attendance range
  const getDistributionData = () => {
    if (!analytics?.stats?.length) return null;
    
    // Define attendance ranges
    const ranges = [
      { label: '0%', min: 0, max: 0, color: '#DC2626' },
      { label: '1-25%', min: 1, max: 25, color: '#EF4444' },
      { label: '26-50%', min: 26, max: 50, color: '#F97316' },
      { label: '51-74%', min: 51, max: 74, color: '#F59E0B' },
      { label: '75-89%', min: 75, max: 89, color: '#22C55E' },
      { label: '90-99%', min: 90, max: 99, color: '#16A34A' },
      { label: '100%', min: 100, max: 100, color: COLORS.primary },
    ];
    
    // Count students in each range
    const counts = ranges.map(range => {
      const count = analytics.stats.filter(s => 
        s.percent >= range.min && s.percent <= range.max
      ).length;
      return count;
    });
    
    return {
      labels: ranges.map(r => r.label),
      datasets: [{
        label: 'Number of Students',
        data: counts,
        backgroundColor: ranges.map(r => r.color),
        borderRadius: 6,
        barThickness: 40,
      }],
      _ranges: ranges,
      _counts: counts,
    };
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (classes.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Analytics</h1>
        <div style={styles.card}>
          <EmptyState
            icon="◈"
            title="No classes available"
            message="Create classes and mark attendance to see analytics"
            action={() => navigate('/classes')}
            actionLabel="Create a Class"
          />
        </div>
      </div>
    );
  }

  const availableSections = getAvailableSections();
  const allStudentsSorted = analytics?.stats 
    ? [...analytics.stats].sort((a, b) => b.percent - a.percent)
    : [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Attendance Analytics</h1>
          <p style={styles.pageSubtitle}>
            {selectedClass ? `${selectedClass.subject} • ${selectedClass.day}` : 'Select a class'}
          </p>
        </div>
        <select
          style={styles.classSelect}
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="">-- Select a class --</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.subject} ({cls.day}, {formatTime(cls.startTime)})
            </option>
          ))}
        </select>
      </div>

      {error && <Alert type="error" message={error} />}

      {!selectedClassId ? (
        <div style={styles.placeholder}>
          <span style={styles.placeholderIcon}>📊</span>
          <p>Select a class to view attendance analytics</p>
        </div>
      ) : analytics?.totalDays === 0 ? (
        <div style={styles.card}>
          <EmptyState
            icon="◧"
            title="No attendance records"
            message="Mark attendance for this class to see analytics"
            action={() => navigate(`/attendance?classId=${selectedClassId}`)}
            actionLabel="Mark Attendance"
          />
        </div>
      ) : analytics ? (
        <>
          {/* Stats Row - Clean white cards with accent border */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{analytics.totalDays}</div>
              <div style={styles.statLabel}>Classes Conducted</div>
            </div>
            <div style={{...styles.statCard, borderLeftColor: COLORS.primary}}>
              <div style={{...styles.statNumber, color: COLORS.primary}}>{analytics.categories?.perfect?.count || 0}</div>
              <div style={styles.statLabel}>Perfect (100%)</div>
            </div>
            <div style={{...styles.statCard, borderLeftColor: COLORS.accentBorder}}>
              <div style={{...styles.statNumber, color: '#0891B2'}}>{analytics.categories?.above75?.count || 0}</div>
              <div style={styles.statLabel}>Good (75-99%)</div>
            </div>
            <div style={{...styles.statCard, borderLeftColor: COLORS.gray300}}>
              <div style={{...styles.statNumber, color: COLORS.gray500}}>{analytics.categories?.critical?.count || 0}</div>
              <div style={styles.statLabel}>Critical (&lt;75%)</div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={styles.twoColumn}>
            {/* Left - Doughnut Chart */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Attendance Overview</h3>
              {getChartData() && (
                <div style={styles.chartWrapper}>
                  <Doughnut
                    data={getChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12, family: 'Inter' },
                          },
                        },
                      },
                    }}
                  />
                  <div style={styles.chartCenter}>
                    <span style={styles.chartCenterNumber}>{analytics.stats?.length || 0}</span>
                    <span style={styles.chartCenterLabel}>Students</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right - Attendance Distribution */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Attendance Distribution</h3>
                <span style={styles.chartNote}>
                  {analytics.stats?.length || 0} students total
                </span>
              </div>
              <p style={styles.chartSubtext}>
                Number of students in each attendance range
              </p>
              {getDistributionData() && (
                <div style={styles.barChartWrapper}>
                  <Bar
                    data={getDistributionData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: COLORS.gray900,
                          titleFont: { size: 13, weight: 'bold' },
                          bodyFont: { size: 12 },
                          padding: 12,
                          callbacks: {
                            title: (items) => {
                              return `${items[0].label} Attendance`;
                            },
                            label: (item) => {
                              const total = analytics.stats?.length || 1;
                              const percent = Math.round((item.raw / total) * 100);
                              return `${item.raw} students (${percent}% of class)`;
                            },
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 10,
                            font: { size: 11 },
                          },
                          grid: {
                            color: COLORS.gray100,
                          },
                          title: {
                            display: true,
                            text: 'Number of Students',
                            font: { size: 11, weight: '500' },
                            color: COLORS.gray500,
                          },
                        },
                        x: {
                          ticks: {
                            font: { size: 11, weight: '500' },
                          },
                          grid: {
                            display: false,
                          },
                          title: {
                            display: true,
                            text: 'Attendance Range',
                            font: { size: 11, weight: '500' },
                            color: COLORS.gray500,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div style={styles.aiCard}>
            <div style={styles.aiHeader}>
              <span style={styles.aiIcon}>✨</span>
              <h3 style={styles.cardTitle}>AI Insights</h3>
            </div>
            {aiInsights ? (
              <div style={styles.aiContent}>
                {aiInsights.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: line ? '0 0 8px 0' : 0 }}>{line}</p>
                ))}
              </div>
            ) : aiError ? (
              <Alert type="error" message={aiError} />
            ) : isLoadingAI ? (
              <div style={styles.aiLoading}>
                <span className="spinner-sm"></span>
                <span>Analyzing attendance patterns...</span>
              </div>
            ) : (
              <div style={styles.aiEmpty}>
                <p>Get AI-powered insights about your class attendance</p>
                <button style={styles.aiButton} onClick={loadAIInsights}>
                  Generate Insights
                </button>
              </div>
            )}
          </div>

          {/* Student Breakdown - Collapsible */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Detailed Breakdown</h3>
              {availableSections.length > 0 && (
                <select
                  style={styles.sectionSelect}
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  <option value="all">All Sections</option>
                  {availableSections.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Critical */}
            {filterBySection(analytics.categories?.critical?.students)?.length > 0 && (
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('critical')}>
                  <div style={styles.accordionLeft}>
                    <span style={{...styles.badge, background: COLORS.gray200, color: COLORS.gray700}}>
                      Critical (&lt;75%)
                    </span>
                    <span style={styles.badgeCount}>
                      {filterBySection(analytics.categories.critical.students).length} students
                    </span>
                  </div>
                  <span style={{
                    ...styles.chevron,
                    transform: expandedSections.critical ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▼</span>
                </button>
                {expandedSections.critical && (
                  <div style={styles.accordionContent}>
                    {filterBySection(analytics.categories.critical.students).map((s) => (
                      <div key={s.studentId} style={styles.breakdownItem}>
                        <span style={styles.breakdownName}>{s.name}</span>
                        <span style={styles.breakdownRoll}>{s.rollNo}</span>
                        <span style={{...styles.breakdownPercent, color: COLORS.gray500}}>{s.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Good */}
            {filterBySection(analytics.categories?.above75?.students)?.length > 0 && (
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('good')}>
                  <div style={styles.accordionLeft}>
                    <span style={{...styles.badge, background: COLORS.accent, color: COLORS.primary}}>
                      Good (75-99%)
                    </span>
                    <span style={styles.badgeCount}>
                      {filterBySection(analytics.categories.above75.students).length} students
                    </span>
                  </div>
                  <span style={{
                    ...styles.chevron,
                    transform: expandedSections.good ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▼</span>
                </button>
                {expandedSections.good && (
                  <div style={styles.accordionContent}>
                    {filterBySection(analytics.categories.above75.students).map((s) => (
                      <div key={s.studentId} style={styles.breakdownItem}>
                        <span style={styles.breakdownName}>{s.name}</span>
                        <span style={styles.breakdownRoll}>{s.rollNo}</span>
                        <span style={{...styles.breakdownPercent, color: '#0891B2'}}>{s.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Perfect */}
            {filterBySection(analytics.categories?.perfect?.students)?.length > 0 && (
              <div style={styles.accordionSection}>
                <button style={styles.accordionHeader} onClick={() => toggleSection('perfect')}>
                  <div style={styles.accordionLeft}>
                    <span style={{...styles.badge, background: COLORS.primary, color: COLORS.white}}>
                      Perfect (100%)
                    </span>
                    <span style={styles.badgeCount}>
                      {filterBySection(analytics.categories.perfect.students).length} students
                    </span>
                  </div>
                  <span style={{
                    ...styles.chevron,
                    transform: expandedSections.perfect ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▼</span>
                </button>
                {expandedSections.perfect && (
                  <div style={styles.accordionContent}>
                    {filterBySection(analytics.categories.perfect.students).map((s) => (
                      <div key={s.studentId} style={styles.breakdownItem}>
                        <span style={styles.breakdownName}>{s.name}</span>
                        <span style={styles.breakdownRoll}>{s.rollNo}</span>
                        <span style={{...styles.breakdownPercent, color: COLORS.primary}}>100%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <LoadingSpinner message="Loading analytics..." />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: COLORS.gray900,
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '0.9375rem',
    color: COLORS.gray500,
    margin: '4px 0 0',
  },
  classSelect: {
    padding: '10px 36px 10px 14px',
    background: COLORS.white,
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: COLORS.gray900,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '18px',
  },

  // Placeholder
  placeholder: {
    background: COLORS.white,
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    border: `1px solid ${COLORS.gray200}`,
  },
  placeholderIcon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '12px',
  },

  // Stats Row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: COLORS.white,
    borderRadius: '12px',
    padding: '20px',
    borderLeft: `4px solid ${COLORS.gray300}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 700,
    color: COLORS.gray900,
    lineHeight: 1,
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '0.8125rem',
    color: COLORS.gray500,
    fontWeight: 500,
  },

  // Cards
  card: {
    background: COLORS.white,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    border: `1px solid ${COLORS.gray200}`,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: COLORS.gray900,
    margin: 0,
  },

  // Two Column
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '20px',
    marginBottom: '20px',
  },

  // Chart
  chartWrapper: {
    position: 'relative',
    maxWidth: '280px',
    margin: '0 auto',
  },
  chartCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -60%)',
    textAlign: 'center',
  },
  chartCenterNumber: {
    display: 'block',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: COLORS.gray900,
  },
  chartCenterLabel: {
    fontSize: '0.75rem',
    color: COLORS.gray500,
  },

  // Bar Chart
  barChartWrapper: {
    height: '400px',
    padding: '8px 0',
  },
  chartNote: {
    fontSize: '0.75rem',
    color: COLORS.gray500,
    fontWeight: 400,
  },
  chartSubtext: {
    fontSize: '0.8125rem',
    color: COLORS.gray500,
    margin: '0 0 16px 0',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: COLORS.gray500,
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },

  // Student List
  studentList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  studentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: `1px solid ${COLORS.gray100}`,
  },
  studentInfo: {
    flex: '0 0 45%',
  },
  studentName: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: COLORS.gray900,
  },
  studentRoll: {
    fontSize: '0.75rem',
    color: COLORS.gray500,
  },
  progressWrapper: {
    flex: '0 0 50%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: COLORS.gray100,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  percentText: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    minWidth: '40px',
    textAlign: 'right',
  },

  // Section Select
  sectionSelect: {
    padding: '6px 28px 6px 10px',
    background: COLORS.gray100,
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: COLORS.gray700,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 6px center',
    backgroundSize: '14px',
  },

  // AI Card
  aiCard: {
    background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.white} 100%)`,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    border: `1px solid ${COLORS.accentBorder}`,
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  aiIcon: {
    fontSize: '1.25rem',
  },
  aiContent: {
    background: 'rgba(255,255,255,0.8)',
    borderRadius: '10px',
    padding: '16px',
    fontSize: '0.9375rem',
    lineHeight: 1.7,
    color: COLORS.gray700,
  },
  aiLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: COLORS.gray500,
  },
  aiEmpty: {
    textAlign: 'center',
    padding: '12px',
    color: COLORS.gray500,
  },
  aiButton: {
    marginTop: '12px',
    padding: '10px 20px',
    background: COLORS.primary,
    color: COLORS.white,
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },

  // Accordion
  accordionSection: {
    borderBottom: `1px solid ${COLORS.gray100}`,
  },
  accordionHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  accordionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  badgeCount: {
    fontSize: '0.8125rem',
    color: COLORS.gray500,
  },
  chevron: {
    fontSize: '0.625rem',
    color: COLORS.gray500,
    transition: 'transform 0.2s ease',
  },
  accordionContent: {
    paddingBottom: '14px',
  },
  breakdownItem: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 60px',
    gap: '12px',
    padding: '8px 12px',
    background: COLORS.gray100,
    borderRadius: '8px',
    marginBottom: '6px',
    alignItems: 'center',
  },
  breakdownName: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: COLORS.gray900,
  },
  breakdownRoll: {
    fontSize: '0.75rem',
    color: COLORS.gray500,
  },
  breakdownPercent: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'right',
  },
};
