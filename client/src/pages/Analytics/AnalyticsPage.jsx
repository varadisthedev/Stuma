import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { attendanceAPI, classesAPI } from '../../services/api';
import { AnalyticsSkeleton } from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

// Site brand palette
const RED = '#b91d20';
const RED_LIGHT = '#FEF2F2';
const RED_MID = '#fee2e2';
const CARD = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)', padding: '24px' };

// A rich red-theme pie palette for volunteers
const PIE_COLORS = [
  '#b91d20', '#da2b2e', '#ef4444', '#f87171', '#fca5a5',
  '#fecaca', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB',
];

// Subject palette - diverse so subjects stand out
const SUBJECT_COLORS = [
  '#b91d20', '#7C3AED', '#0369a1', '#059669', '#D97706',
  '#DB2777', '#2563EB', '#16A34A', '#EA580C', '#6D28D9',
];

// ─── Admin Analytics View ────────────────────────────────────────────────────
function AdminAnalytics({ data }) {
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiRequested, setAiRequested] = useState(false);

  const loadAI = async () => {
    setAiRequested(true);
    setAiLoading(true);
    setAiError('');
    try {
      const res = await attendanceAPI.getOverallAI();
      if (res.success && res.text) {
        setAiText(res.text);
      } else {
        setAiError(res.message || 'No insights returned.');
      }
    } catch (err) {
      setAiError('Failed to reach AI service.');
    }
    setAiLoading(false);
  };

  const volunteerPieData = {
    labels: data.volunteerDistribution.map(v => v.name),
    datasets: [{
      data: data.volunteerDistribution.map(v => v.count),
      backgroundColor: PIE_COLORS.slice(0, data.volunteerDistribution.length),
      borderWidth: 2,
      borderColor: 'white',
      cutout: '60%',
    }],
  };

  const weeklyBarData = {
    labels: data.weeklyData.map(w => w.label),
    datasets: [{
      label: 'Classes',
      data: data.weeklyData.map(w => w.count),
      backgroundColor: data.weeklyData.map((_, i) =>
        i === data.weeklyData.length - 1 ? RED : `rgba(185,29,32,${0.25 + i * 0.07})`
      ),
      borderRadius: 8,
      barThickness: 32,
    }],
  };

  const commonChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 13, weight: 'bold', family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>Analytics</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', background: RED }} />
            <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>Program-wide insights — all classes &amp; volunteers</p>
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Classes', value: data.totalClasses, icon: 'event', color: RED, bg: RED_LIGHT },
          { label: 'Attendance Sessions', value: data.totalSessions, icon: 'assignment_turned_in', color: '#0369a1', bg: '#EFF6FF' },
          { label: 'Overall Rate', value: `${data.overallRate}%`, icon: 'trending_up', color: data.overallRate >= 75 ? '#16A34A' : data.overallRate >= 50 ? '#D97706' : RED, bg: data.overallRate >= 75 ? '#F0FDF4' : data.overallRate >= 50 ? '#FFFBEB' : RED_LIGHT },
          { label: 'Active Volunteers', value: data.volunteerDistribution.filter(v => v.name !== 'Unassigned').length, icon: 'people', color: '#7C3AED', bg: '#F5F3FF' },
        ].map(s => (
          <div key={s.label} style={{ ...CARD, display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', marginBottom: '20px' }}>
        {/* Volunteer Pie */}
        <div style={CARD}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Volunteer Distribution</div>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: '0 0 20px 0' }}>Classes per Volunteer</h3>
          {data.volunteerDistribution.length > 0 ? (
            <>
              <div style={{ height: '220px', position: 'relative' }}>
                <Doughnut data={volunteerPieData} options={{
                  ...commonChartOpts,
                  maintainAspectRatio: false,
                  plugins: {
                    ...commonChartOpts.plugins,
                    legend: { display: false },
                    tooltip: {
                      ...commonChartOpts.plugins.tooltip,
                      callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} classes` },
                    },
                  },
                }} />
              </div>
              {/* Custom legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', maxHeight: '120px', overflowY: 'auto' }}>
                {data.volunteerDistribution.map((v, i) => (
                  <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[i] || '#9CA3AF', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8125rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', flexShrink: 0 }}>{v.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9CA3AF', fontSize: '0.875rem' }}>
              No class data yet
            </div>
          )}
        </div>

        {/* Weekly Bar Chart */}
        <div style={CARD}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Activity Over Time</div>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: '0 0 20px 0' }}>Weekly Class Count</h3>
          <div style={{ height: '280px' }}>
            <Bar data={weeklyBarData} options={{
              ...commonChartOpts,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0, color: '#9CA3AF', font: { size: 11, family: 'Inter' } },
                  grid: { color: '#F3F4F6' },
                  border: { display: false },
                },
                x: {
                  ticks: { color: '#9CA3AF', font: { size: 10, family: 'Inter' } },
                  grid: { display: false },
                  border: { display: false },
                },
              },
              plugins: {
                ...commonChartOpts.plugins,
                tooltip: { ...commonChartOpts.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.raw} class${ctx.raw !== 1 ? 'es' : ''}` } },
              },
            }} />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ ...CARD, background: aiText ? 'white' : 'linear-gradient(135deg, #FFF5F5 0%, white 100%)', border: `1px solid ${aiText ? '#EBEBEB' : RED_MID}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: RED_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Powered by Gemini AI</div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: 0 }}>Program Insights</h3>
          </div>
        </div>

        {aiText ? (
          <div style={{ background: '#FAFAFA', borderRadius: '12px', padding: '16px 18px', border: '1px solid #F3F4F6' }}>
            {aiText.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7, margin: i > 0 ? '8px 0 0' : 0 }}>{line}</p>
            ))}
          </div>
        ) : aiError ? (
          <Alert type="error" message={aiError} />
        ) : aiLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Skeleton height="18px" width="80%" />
            <Skeleton height="18px" width="95%" />
            <Skeleton height="18px" width="70%" />
            <div style={{ marginTop: '6px', fontSize: '0.8125rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Analyzing program data with Gemini...</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
              Get AI-powered insights about your overall program health, volunteer activity, and attendance trends.
            </p>
            <button
              onClick={loadAI}
              style={{ background: RED, color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(185,29,32,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '16px' }}>✨</span> Generate Insights
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Volunteer Analytics View ────────────────────────────────────────────────
function VolunteerAnalytics({ currentUser }) {
  const [myClasses, setMyClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const myId = currentUser?._id || currentUser?.id;
        const res = await classesAPI.getAll();
        const all = res.classes || [];
        const mine = all.filter(c =>
          c.assignedVolunteer &&
          (c.assignedVolunteer._id === myId || c.assignedVolunteer === myId)
        );
        setMyClasses(mine);
      } catch (err) {
        setError('Failed to load your class data.');
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const toMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

    const pastClasses = myClasses.filter(c => {
      if (c.date < todayStr) return true;
      if (c.date === todayStr) {
        const [eh, em] = (c.endTime || '00:00').split(':').map(Number);
        return (eh * 60 + em) <= currentMinutes;
      }
      return false;
    });
    const upcomingClasses = myClasses.filter(c => !pastClasses.includes(c));

    // Total teaching minutes from ALL classes (past)
    const totalMinutes = pastClasses.reduce((sum, c) => {
      const dur = toMins(c.endTime) - toMins(c.startTime);
      return sum + (dur > 0 ? dur : 0);
    }, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Subject distribution
    const subjectMap = {};
    myClasses.forEach(c => {
      const subject = c.subject || 'Other';
      subjectMap[subject] = (subjectMap[subject] || 0) + 1;
    });
    const subjects = Object.entries(subjectMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Weekly activity — last 8 weeks
    const weeklyData = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = myClasses.filter(c => {
        const d = new Date(c.date);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeklyData.push({ label, count });
    }

    // Completion rate (past vs total)
    const completionRate = myClasses.length > 0
      ? Math.round((pastClasses.length / myClasses.length) * 100)
      : 0;

    // Next upcoming class
    const sorted = [...upcomingClasses].sort((a, b) =>
      a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)
    );
    const nextClass = sorted[0] || null;

    return { pastClasses, upcomingClasses, totalHours, subjects, weeklyData, completionRate, nextClass };
  }, [myClasses]);

  if (isLoading) return <AnalyticsSkeleton />;
  if (error) return <Alert type="error" message={error} />;

  const subjectPieData = {
    labels: stats.subjects.map(s => s.name),
    datasets: [{
      data: stats.subjects.map(s => s.count),
      backgroundColor: SUBJECT_COLORS.slice(0, stats.subjects.length),
      borderWidth: 2,
      borderColor: 'white',
      cutout: '58%',
    }],
  };

  const weeklyBarData = {
    labels: stats.weeklyData.map(w => w.label),
    datasets: [{
      label: 'My Classes',
      data: stats.weeklyData.map(w => w.count),
      backgroundColor: stats.weeklyData.map((_, i) =>
        i === stats.weeklyData.length - 1 ? RED : `rgba(185,29,32,${0.2 + i * 0.08})`
      ),
      borderRadius: 8,
      barThickness: 28,
    }],
  };

  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 13, weight: 'bold', family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  // Completion ring (fake doughnut)
  const ringData = {
    labels: ['Completed', 'Remaining'],
    datasets: [{
      data: [stats.pastClasses.length, Math.max(0, stats.upcomingClasses.length)],
      backgroundColor: ['#059669', '#F3F4F6'],
      borderWidth: 0,
      cutout: '75%',
    }],
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>My Analytics</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', background: RED }} />
            <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>Your personal teaching activity &amp; progress</p>
          </div>
        </div>
      </div>

      {/* Personal stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'My Total Classes', value: myClasses.length, icon: 'book', color: RED, bg: RED_LIGHT },
          { label: 'Classes Completed', value: stats.pastClasses.length, icon: 'check_circle', color: '#059669', bg: '#F0FDF4' },
          { label: 'Upcoming Classes', value: stats.upcomingClasses.length, icon: 'event', color: '#0369a1', bg: '#EFF6FF' },
          { label: 'Teaching Hours', value: `${stats.totalHours}h`, icon: 'schedule', color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Subjects Taught', value: stats.subjects.length, icon: 'subject', color: '#D97706', bg: '#FFFBEB' },
        ].map(s => (
          <div key={s.label} style={{ ...CARD, display: 'flex', gap: '12px', alignItems: 'center', padding: '18px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '21px', color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 600, marginTop: '3px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', marginBottom: '20px' }}>
        {/* Subject Distribution Doughnut */}
        <div style={CARD}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Subject Breakdown</div>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: '0 0 20px 0' }}>Classes by Subject</h3>
          {stats.subjects.length > 0 ? (
            <>
              <div style={{ height: '200px', position: 'relative' }}>
                <Doughnut data={subjectPieData} options={{
                  ...commonOpts,
                  maintainAspectRatio: false,
                  plugins: {
                    ...commonOpts.plugins,
                    tooltip: {
                      ...commonOpts.plugins.tooltip,
                      callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} class${ctx.raw !== 1 ? 'es' : ''}` },
                    },
                  },
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', maxHeight: '130px', overflowY: 'auto' }}>
                {stats.subjects.map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: SUBJECT_COLORS[i] || '#9CA3AF', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8125rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', flexShrink: 0 }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', gap: '12px', color: '#9CA3AF' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>auto_stories</span>
              <span style={{ fontSize: '0.875rem' }}>No classes assigned yet</span>
            </div>
          )}
        </div>

        {/* Weekly Activity Bar */}
        <div style={CARD}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Teaching Activity</div>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: '0 0 20px 0' }}>My Weekly Class Count</h3>
          <div style={{ height: '260px' }}>
            <Bar data={weeklyBarData} options={{
              ...commonOpts,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0, color: '#9CA3AF', font: { size: 11, family: 'Inter' } },
                  grid: { color: '#F3F4F6' },
                  border: { display: false },
                },
                x: {
                  ticks: { color: '#9CA3AF', font: { size: 10, family: 'Inter' } },
                  grid: { display: false },
                  border: { display: false },
                },
              },
              plugins: {
                ...commonOpts.plugins,
                tooltip: { ...commonOpts.plugins.tooltip, callbacks: { label: ctx => ` ${ctx.raw} class${ctx.raw !== 1 ? 'es' : ''}` } },
              },
            }} />
          </div>
        </div>
      </div>

      {/* Bottom row: Completion ring + Next class */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Completion ring */}
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px 24px' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progress</div>
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            <Doughnut data={ringData} options={{
              ...commonOpts,
              maintainAspectRatio: false,
              plugins: { ...commonOpts.plugins, tooltip: { enabled: false } },
              events: [],
            }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{stats.completionRate}%</div>
              <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 600 }}>complete</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>Class Completion Rate</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>{stats.pastClasses.length} done · {stats.upcomingClasses.length} remaining</div>
          </div>
        </div>

        {/* Next class + recent past */}
        <div style={CARD}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Schedule</div>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: '0 0 20px 0' }}>Upcoming &amp; Recent Classes</h3>
          {myClasses.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', gap: '10px', color: '#9CA3AF' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>event_busy</span>
              <span style={{ fontSize: '0.875rem' }}>No classes scheduled yet</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {[...stats.upcomingClasses].sort((a,b) => a.date.localeCompare(b.date)).slice(0,3).map(c => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#FFF5F5', borderRadius: '10px', border: '1px solid #FEE2E2' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem' }}>{c.subject}</div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: '2px' }}>{c.startTime} – {c.endTime}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#b91d20' }}>{c.date}</span>
                    <span style={{ background: '#FEF2F2', color: '#b91d20', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>Upcoming</span>
                  </div>
                </div>
              ))}
              {[...stats.pastClasses].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3).map(c => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #F3F4F6' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#6B7280', fontSize: '0.9375rem' }}>{c.subject}</div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: '2px' }}>{c.startTime} – {c.endTime}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#9CA3AF' }}>{c.date}</span>
                    <span style={{ background: '#F0FDF4', color: '#059669', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>Done</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const isVolunteer = currentUser?.role === 'volunteer';

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVolunteer) {
      // Volunteer view fetches data inside VolunteerAnalytics
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await attendanceAPI.getOverall();
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || 'Failed to load analytics');
        }
      } catch (err) {
        setError('Failed to load analytics. Please try again.');
      }
      setIsLoading(false);
    };
    load();
  }, [isVolunteer]);

  // Volunteer gets their own view
  if (isVolunteer) {
    return <VolunteerAnalytics currentUser={currentUser} />;
  }

  if (isLoading) return <AnalyticsSkeleton />;
  if (error) return <Alert type="error" message={error} />;
  if (!data) return null;

  return <AdminAnalytics data={data} />;
}
