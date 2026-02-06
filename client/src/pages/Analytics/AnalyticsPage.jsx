/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Analytics Page - Dual Mode Design
 * View attendance statistics with Individual Daily or Overall Trends modes
 * Features GitHub-style heatmap for individual roll number attendance
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { classesAPI, attendanceAPI } from '../../services/api';
import { formatTime } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

// Dynamic color palette based on theme
const getColors = (isDark) => ({
  primary: isDark ? '#60A5FA' : '#09416D',
  accent: isDark ? '#6366F1' : '#DBFCFF',
  accentBorder: isDark ? '#818CF8' : '#A8E8EF',
  gray100: isDark ? '#1E293B' : '#F8FAFC',
  gray200: isDark ? '#334155' : '#E5E7EB',
  gray300: isDark ? '#475569' : '#D1D5DB',
  gray500: isDark ? '#94A3B8' : '#6B7280',
  gray700: isDark ? '#CBD5E1' : '#374151',
  gray900: isDark ? '#F1F5F9' : '#1F2937',
  white: isDark ? '#1E293B' : '#FFFFFF',
  cardBg: isDark ? '#1E293B' : '#FFFFFF',
  surfaceBg: isDark ? '#0F172A' : '#F8FAFC',
});

// Heatmap color scale (light to dark for attendance percentage)
const getHeatmapColor = (percent, isDark) => {
  if (percent === 0) return isDark ? '#1E293B' : '#EBEDF0';
  if (percent < 25) return isDark ? '#0E4429' : '#9BE9A8';
  if (percent < 50) return isDark ? '#006D32' : '#40C463';
  if (percent < 75) return isDark ? '#26A641' : '#30A14E';
  if (percent < 100) return isDark ? '#39D353' : '#216E39';
  return isDark ? '#39D353' : '#09416D'; // 100%
};

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  const [aiInsights, setAiInsights] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // View mode: 'individual' or 'overall'
  const [viewMode, setViewMode] = useState('individual');

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

  // Overall trend line chart
  const getTrendData = () => {
    if (!analytics?.stats?.length) return null;
    
    // Sort students by attendance percentage
    const sortedStudents = [...analytics.stats].sort((a, b) => b.percent - a.percent);
    
    // Create trend data showing cumulative distribution
    const labels = sortedStudents.map(s => s.rollNo);
    const data = sortedStudents.map(s => s.percent);
    
    return {
      labels,
      datasets: [{
        label: 'Attendance %',
        data,
        fill: true,
        backgroundColor: isDarkMode 
          ? 'rgba(96, 165, 250, 0.2)' 
          : 'rgba(9, 65, 109, 0.1)',
        borderColor: COLORS.primary,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: COLORS.primary,
      }],
    };
  };

  // Weekly trend for overall view
  const getWeeklyTrendData = () => {
    if (!analytics?.dailyRecords?.length) return null;
    
    const records = analytics.dailyRecords.slice(-10); // Last 10 records
    
    return {
      labels: records.map(r => new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Attendance Rate',
        data: records.map(r => Math.round((r.presentCount / r.totalStudents) * 100)),
        fill: true,
        backgroundColor: isDarkMode 
          ? 'rgba(99, 102, 241, 0.2)' 
          : 'rgba(219, 252, 255, 0.5)',
        borderColor: COLORS.primary,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: COLORS.primary,
      }],
    };
  };

  // Heatmap data for individual view
  const getHeatmapData = () => {
    if (!analytics?.stats?.length) return null;
    
    const filteredStats = filterBySection(analytics.stats);
    
    // Sort by roll number
    const sortedStats = [...filteredStats].sort((a, b) => {
      const rollA = a.rollNo || '';
      const rollB = b.rollNo || '';
      return rollA.localeCompare(rollB);
    });
    
    return sortedStats;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (classes.length === 0) {
    return (
      <div style={getStyles(COLORS).container}>
        <h1 style={getStyles(COLORS).pageTitle}>Analytics</h1>
        <div style={getStyles(COLORS).card}>
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
  const styles = getStyles(COLORS);

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
        <div style={styles.headerControls}>
          {/* View Mode Toggle */}
          <div className="analytics-mode-toggle">
            <button
              className={`analytics-mode-btn ${viewMode === 'individual' ? 'active' : ''}`}
              onClick={() => setViewMode('individual')}
            >
              📊 Individual Daily
            </button>
            <button
              className={`analytics-mode-btn ${viewMode === 'overall' ? 'active' : ''}`}
              onClick={() => setViewMode('overall')}
            >
              📈 Overall Trends
            </button>
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
          {/* Stats Row - Clean cards */}
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
              <div style={{...styles.statNumber, color: isDarkMode ? '#818CF8' : '#0891B2'}}>{analytics.categories?.above75?.count || 0}</div>
              <div style={styles.statLabel}>Good (75-99%)</div>
            </div>
            <div style={{...styles.statCard, borderLeftColor: COLORS.gray300}}>
              <div style={{...styles.statNumber, color: COLORS.gray500}}>{analytics.categories?.critical?.count || 0}</div>
              <div style={styles.statLabel}>Critical (&lt;75%)</div>
            </div>
          </div>

          {/* INDIVIDUAL VIEW MODE */}
          {viewMode === 'individual' && (
            <>
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
                                color: COLORS.gray700,
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

                {/* Right - GitHub-style Heatmap */}
                <div style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Student Attendance Heatmap</h3>
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
                  <p style={styles.chartSubtext}>
                    Each box represents a student • Darker = Higher attendance
                  </p>
                  
                  {/* Heatmap Grid */}
                  <div 
                    className="heatmap-container"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(getHeatmapData()?.length || 1) * 1.5), 15)}, 1fr)`,
                    }}
                  >
                    {getHeatmapData()?.map((student, idx) => (
                      <div
                        key={student.studentId || idx}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: getHeatmapColor(student.percent, isDarkMode),
                          color: student.percent > 50 ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#374151'),
                        }}
                      >
                        <span className="tooltip">
                          {student.name} ({student.rollNo})<br/>
                          {student.percent}% Attendance
                        </span>
                        {student.rollNo?.slice(-2) || ''}
                      </div>
                    ))}
                  </div>
                  
                  {/* Heatmap Legend */}
                  <div className="heatmap-legend">
                    <span className="heatmap-legend-label">Less</span>
                    <div className="heatmap-legend-gradient">
                      {[0, 25, 50, 75, 100].map(p => (
                        <div
                          key={p}
                          className="heatmap-legend-box"
                          style={{ backgroundColor: getHeatmapColor(p, isDarkMode) }}
                        />
                      ))}
                    </div>
                    <span className="heatmap-legend-label">More</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* OVERALL VIEW MODE */}
          {viewMode === 'overall' && (
            <>
              {/* Two Column Layout for Overall View */}
              <div style={styles.twoColumn}>
                {/* Left - Trend Line Chart */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Student Attendance Ranking</h3>
                  <p style={styles.chartSubtext}>
                    All students sorted by attendance percentage
                  </p>
                  {getTrendData() && (
                    <div style={styles.lineChartWrapper}>
                      <Line
                        data={getTrendData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: COLORS.gray900,
                              titleFont: { size: 13, weight: 'bold' },
                              bodyFont: { size: 12 },
                              padding: 12,
                            },
                          },
                          scales: {
                            y: {
                              min: 0,
                              max: 100,
                              ticks: {
                                callback: (val) => `${val}%`,
                                font: { size: 11 },
                                color: COLORS.gray500,
                              },
                              grid: { color: COLORS.gray200 },
                            },
                            x: {
                              display: false,
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Right - Daily Trend */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Class Attendance Trend</h3>
                  <p style={styles.chartSubtext}>
                    Daily attendance rate over recent classes
                  </p>
                  {getWeeklyTrendData() ? (
                    <div style={styles.lineChartWrapper}>
                      <Line
                        data={getWeeklyTrendData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: COLORS.gray900,
                              callbacks: {
                                label: (item) => `${item.raw}% present`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              min: 0,
                              max: 100,
                              ticks: {
                                callback: (val) => `${val}%`,
                                font: { size: 11 },
                                color: COLORS.gray500,
                              },
                              grid: { color: COLORS.gray200 },
                            },
                            x: {
                              ticks: {
                                font: { size: 10 },
                                color: COLORS.gray500,
                              },
                              grid: { display: false },
                            },
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <div style={styles.noDataPlaceholder}>
                      <p>No daily records available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Distribution Bar Chart for Overall View */}
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
                {analytics?.stats?.length > 0 && (
                  <div style={styles.barChartWrapper}>
                    <Bar
                      data={{
                        labels: ['0%', '1-25%', '26-50%', '51-74%', '75-89%', '90-99%', '100%'],
                        datasets: [{
                          label: 'Number of Students',
                          data: [
                            analytics.stats.filter(s => s.percent === 0).length,
                            analytics.stats.filter(s => s.percent >= 1 && s.percent <= 25).length,
                            analytics.stats.filter(s => s.percent >= 26 && s.percent <= 50).length,
                            analytics.stats.filter(s => s.percent >= 51 && s.percent <= 74).length,
                            analytics.stats.filter(s => s.percent >= 75 && s.percent <= 89).length,
                            analytics.stats.filter(s => s.percent >= 90 && s.percent <= 99).length,
                            analytics.stats.filter(s => s.percent === 100).length,
                          ],
                          backgroundColor: [
                            '#DC2626', '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#16A34A', COLORS.primary
                          ],
                          borderRadius: 6,
                          barThickness: 40,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { font: { size: 11 }, color: COLORS.gray500 },
                            grid: { color: COLORS.gray200 },
                          },
                          x: {
                            ticks: { font: { size: 11 }, color: COLORS.gray500 },
                            grid: { display: false },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* AI Insights - Available in both modes */}
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
                        <span style={{...styles.breakdownPercent, color: isDarkMode ? '#818CF8' : '#0891B2'}}>{s.percent}%</span>
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

const getStyles = (COLORS) => ({
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
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
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
    color: COLORS.gray500,
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

  // Line/Bar Chart
  lineChartWrapper: {
    height: '300px',
    padding: '8px 0',
  },
  barChartWrapper: {
    height: '300px',
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
  noDataPlaceholder: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.gray500,
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
});
