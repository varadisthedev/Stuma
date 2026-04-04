import { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { GridPageSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle = { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontSize: '0.875rem', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' };

// Mini bar chart for attendance
function AttendanceBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#111827' }}>{value}/{max} ({pct}%)</span>
      </div>
      <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '10px', transition: 'width 500ms ease' }} />
      </div>
    </div>
  );
}

// Student detail panel
function StudentDetail({ student, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await studentsAPI.getStats(student._id);
        setStats(res);
      } catch (e) { setStats({ totalClasses: 0, attended: 0, absent: 0, records: [] }); }
      setLoading(false);
    };
    load();
  }, [student._id]);

  const attendancePct = stats && stats.totalClasses > 0 ? Math.round((stats.attended / stats.totalClasses) * 100) : 0;
  const statusColor = attendancePct >= 75 ? '#16A34A' : attendancePct >= 50 ? '#D97706' : '#b91d20';

  return (
    <div style={{ ...card, overflow: 'hidden', position: 'sticky', top: '16px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #b91d20 0%, #da2b2e 100%)', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', color: 'white', flexShrink: 0 }}>
          {student.name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Roll #{student.rollNo} · {student.section}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>Loading stats...</div>
        ) : (
          <>
            {/* Attendance overview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#b91d20', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Attendance Overview</div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Total', value: stats.totalClasses, bg: '#F3F4F6', color: '#111827' },
                  { label: 'Present', value: stats.attended, bg: '#F0FDF4', color: '#16A34A' },
                  { label: 'Absent', value: stats.absent, bg: '#FEF2F2', color: '#b91d20' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: '10px', padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <AttendanceBar label="Attendance Rate" value={stats.attended} max={stats.totalClasses} color={statusColor} />
            </div>

            {/* Contact info */}
            {(student.phone || student.parentPhone) && (
              <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Contact</div>
                {student.phone && <div style={{ fontSize: '0.8125rem', color: '#374151', marginBottom: '4px' }}>📱 {student.phone}</div>}
                {student.parentPhone && <div style={{ fontSize: '0.8125rem', color: '#374151' }}>👨‍👩‍👦 Parent: {student.parentPhone}</div>}
              </div>
            )}

            {/* Notes */}
            {student.notes && (
              <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Admin Notes</div>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.6, margin: 0, background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px' }}>{student.notes}</p>
              </div>
            )}

            {/* Recent attendance records with volunteer notes */}
            {stats.records.length > 0 && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Recent Classes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {stats.records.slice(0, 10).map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 10px', background: r.status === 'present' ? '#F0FDF4' : '#FEF2F2', borderRadius: '8px', gap: '8px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</div>
                        <div style={{ fontSize: '0.625rem', color: '#9CA3AF' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · by {r.takenBy}</div>
                        {r.note && <div style={{ fontSize: '0.625rem', color: '#6B7280', marginTop: '2px', fontStyle: 'italic' }}>📝 {r.note}</div>}
                      </div>
                      <span style={{ flexShrink: 0, fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: r.status === 'present' ? '#BBF7D0' : '#FEE2E2', color: r.status === 'present' ? '#15803D' : '#b91d20' }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const isVolunteer = currentUser?.role === 'volunteer';

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({ name: '', rollNo: '', section: '', phone: '', parentPhone: '', notes: '' });

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentsAPI.getAll();
      setStudents(res.students || []);
    } catch (e) { setError('Failed to load students.'); }
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await studentsAPI.create(formData);
      if (res.success) {
        setSuccess('Student added successfully!');
        setIsModalOpen(false);
        setFormData({ name: '', rollNo: '', section: '', phone: '', parentPhone: '', notes: '' });
        loadStudents();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setFormError(e.response?.data?.message || 'Failed to add student.');
    }
    setIsSubmitting(false);
  };

  const filtered = students.filter(s => {
    const searchMatch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                        s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
                        s.section.toLowerCase().includes(search.toLowerCase());
    const sectionMatch = sectionFilter ? s.section === sectionFilter : true;
    return searchMatch && sectionMatch;
  });

  // Group by section from ALL students (so the dropdown shows all possible sections)
  const allSections = [...new Set(students.map(s => s.section))].sort();
  // Sections to render for the filtered output
  const renderSections = [...new Set(filtered.map(s => s.section))].sort();

  if (isLoading) return <GridPageSkeleton />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>Students</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', background: '#b91d20' }}></div>
            <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>{students.length} students enrolled</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={sectionFilter} 
            onChange={e => setSectionFilter(e.target.value)} 
            style={{ ...inputStyle, width: '160px', padding: '8px 12px', cursor: 'pointer' }}
          >
            <option value="">All Sections</option>
            {allSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, roll, section..." style={{ ...inputStyle, width: '220px', boxSizing: 'border-box', padding: '8px 14px' }} />
          {!isVolunteer && (
            <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(185,29,32,0.25)', whiteSpace: 'nowrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span> Add Student
            </button>
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Student list */}
        <div>
          {students.length === 0 ? (
            <div style={{ ...card, padding: '64px 32px', textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', background: '#FEF2F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#b91d20' }}>people</span>
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: '12px' }}>No students yet</h2>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>{isVolunteer ? 'Admin has not added any students yet.' : 'Start by adding your first student.'}</p>
              {!isVolunteer && (
                <button onClick={() => setIsModalOpen(true)} style={{ background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>Add First Student</button>
              )}
            </div>
          ) : (
            renderSections.map(section => (
              <div key={section} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#b91d20', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{section}</span>
                  <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }}></div>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>{filtered.filter(s => s.section === section).length} students</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                  {filtered.filter(s => s.section === section).map(student => {
                    const isSelected = selected?._id === student._id;
                    return (
                      <div key={student._id} onClick={() => setSelected(isSelected ? null : student)} style={{ ...card, padding: '16px', cursor: 'pointer', border: isSelected ? '2px solid #b91d20' : '1px solid #EBEBEB', boxShadow: isSelected ? '0 4px 20px rgba(185,29,32,0.12)' : '0 4px 16px rgba(0,0,0,0.06)', transition: 'all 150ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isSelected ? '#FEE2E2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: isSelected ? '#b91d20' : '#6B7280', flexShrink: 0 }}>
                            {student.name[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>Roll #{student.rollNo}</div>
                          </div>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isSelected ? '#b91d20' : '#D1D5DB', marginLeft: 'auto', flexShrink: 0 }}>
                            {isSelected ? 'expand_less' : 'chevron_right'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && <StudentDetail student={selected} onClose={() => setSelected(null)} />}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Add New Student</span>}
        footer={
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 1, background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <Alert type="error" message={formError} />}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" style={inputStyle} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required placeholder="Student's full name" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Roll No *</label>
              <input type="text" style={inputStyle} value={formData.rollNo} onChange={e => setFormData(p => ({ ...p, rollNo: e.target.value }))} required placeholder="e.g. 101" />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Section / Class *</label>
            <input type="text" style={inputStyle} value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value.toUpperCase() }))} required placeholder="e.g. GRADE 8A, FOUNDATION" />
            {allSections.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', alignSelf: 'center' }}>Frequent:</span>
                {allSections.slice(0, 5).map(s => (
                  <button 
                    key={s} 
                    type="button" 
                    onClick={() => setFormData(p => ({ ...p, section: s }))}
                    style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Student Phone</label>
              <input type="tel" style={inputStyle} value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9999999999" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Parent Phone</label>
              <input type="tel" style={inputStyle} value={formData.parentPhone} onChange={e => setFormData(p => ({ ...p, parentPhone: e.target.value }))} placeholder="+91 9999999999" />
            </div>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <label style={labelStyle}>Admin Notes</label>
            <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes about this student..." />
          </div>
        </form>
      </Modal>
    </div>
  );
}
