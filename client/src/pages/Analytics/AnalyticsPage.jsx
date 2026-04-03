import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { attendanceAPI } from '../../services/api';
import { AnalyticsSkeleton } from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';

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

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiRequested, setAiRequested] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        console.log('[ANALYTICS PAGE] Loading overall analytics...');
        const res = await attendanceAPI.getOverall();
        console.log('[ANALYTICS PAGE] Received:', res);
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('[ANALYTICS PAGE] Error:', err);
        setError('Failed to load analytics. Please try again.');
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const loadAI = async () => {
    setAiRequested(true);
    setAiLoading(true);
    setAiError('');
    try {
      console.log('[ANALYTICS PAGE] Requesting AI insights...');
      const res = await attendanceAPI.getOverallAI();
      console.log('[ANALYTICS PAGE] AI response:', res);
      if (res.success && res.text) {
        setAiText(res.text);
      } else {
        setAiError(res.message || 'No insights returned.');
      }
    } catch (err) {
      console.error('[ANALYTICS PAGE] AI error:', err);
      setAiError('Failed to reach AI service.');
    }
    setAiLoading(false);
  };

  if (isLoading) return <AnalyticsSkeleton />;

  if (error) return <Alert type="error" message={error} />;

  if (!data) return null;

  // Pie chart data: volunteer distribution
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

  // Bar chart: weekly class counts
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
