import { useState, useEffect, useMemo } from 'react';
import { authAPI, classesAPI, messagesAPI } from '../../services/api';
import { ListPageSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import { AdminMessageInbox } from '../../components/chat/ChatComponents';

const inputStyle = { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontSize: '0.875rem', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' };

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [editFormData, setEditFormData] = useState({ _id: '', name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [volResponse, classResponse] = await Promise.all([
          authAPI.getVolunteers(),
          classesAPI.getAll()
        ]);
        if (volResponse.volunteers) setVolunteers(volResponse.volunteers);
        if (classResponse.classes) setClasses(classResponse.classes);
      } catch (error) {
        console.error('Failed to load volunteers data', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const volunteerStats = useMemo(() => {
    const stats = {};
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    volunteers.forEach(v => {
      const vClasses = classes.filter(c =>
        c.assignedVolunteer &&
        (c.assignedVolunteer._id === v._id || c.assignedVolunteer === v._id)
      );
      const upcomingClasses = vClasses.filter(c => {
        if (c.date > todayStr) return true;
        if (c.date === todayStr) {
          const [eh, em] = (c.endTime || '23:59').split(':').map(Number);
          return (eh * 60 + em) > currentMinutes;
        }
        return false;
      }).sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime));
      stats[v._id] = {
        totalClasses: vClasses.length,
        upcomingClasses,
        pastClasses: vClasses.filter(c => !upcomingClasses.includes(c) && c.date <= todayStr),
      };
    });
    return stats;
  }, [classes, volunteers]);

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await authAPI.createVolunteer(formData);
      if (res.success) {
        setSuccess('Volunteer added successfully!');
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '' });
        const volRes = await authAPI.getVolunteers();
        if (volRes.volunteers) setVolunteers(volRes.volunteers);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add volunteer.');
    }
    setIsSubmitting(false);
  };

  const handleEditClick = () => {
    if (!selectedVolunteer) return;
    setEditFormData({ _id: selectedVolunteer._id, name: selectedVolunteer.name, email: selectedVolunteer.email, phone: selectedVolunteer.phone || '', password: '' });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateVolunteer = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await authAPI.updateVolunteer(editFormData._id, editFormData);
      if (res.success) {
        setSuccess('Volunteer updated successfully!');
        setIsEditModalOpen(false);
        const volRes = await authAPI.getVolunteers();
        if (volRes.volunteers) { 
          setVolunteers(volRes.volunteers);
          const updated = volRes.volunteers.find(v => v._id === editFormData._id);
          if (updated) setSelectedVolunteer(updated);
        }
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update volunteer.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteVolunteer = async () => {
    setIsSubmitting(true);
    try {
      await authAPI.deleteVolunteer(selectedVolunteer._id);
      setSuccess('Volunteer deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedVolunteer(null);
      const volRes = await authAPI.getVolunteers();
      if (volRes.volunteers) setVolunteers(volRes.volunteers);
      setTimeout(() => setSuccess(''), 3000);
    } catch(err) {
      setFormError('Failed to delete volunteer.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <ListPageSkeleton />;

  const selected = selectedVolunteer;
  const stats = selected ? volunteerStats[selected._id] : null;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>Volunteer Portal</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', backgroundColor: '#b91d20' }}></div>
            <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>{volunteers.length} volunteers · Manage and view performance metrics</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(185,29,32,0.25)', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span> Add Volunteer
        </button>
      </div>
      {success && <Alert type="success" message={success} />}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>

        {/* Left: Volunteer List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {volunteers.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#D1D5DB', display: 'block', marginBottom: '12px' }}>group_off</span>
              <p style={{ color: '#6B7280', margin: 0 }}>No volunteers registered yet.</p>
            </div>
          )}
          {volunteers.map(volunteer => {
            const vStats = volunteerStats[volunteer._id];
            const isSelected = selected?._id === volunteer._id;
            return (
              <div
                key={volunteer._id}
                onClick={() => setSelectedVolunteer(isSelected ? null : volunteer)}
                style={{
                  background: 'white',
                  border: isSelected ? '2px solid #b91d20' : '1px solid #EBEBEB',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 8px 24px rgba(185,29,32,0.12)' : '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 200ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: vStats?.totalClasses > 0 ? '16px' : 0 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: isSelected ? '#b91d20' : '#fef2f2',
                    color: isSelected ? 'white' : '#b91d20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.25rem', overflow: 'hidden'
                  }}>
                    {volunteer.profilePicUrl ? (
                      <img src={volunteer.profilePicUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    ) : (
                      volunteer.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {volunteer.name}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {volunteer.email}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isSelected ? '#b91d20' : '#374151' }}>{vStats?.totalClasses || 0}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>classes</div>
                  </div>
                </div>
                {vStats?.totalClasses > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, background: '#fef2f2', borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#b91d20', fontSize: '1rem' }}>{vStats.upcomingClasses.length}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>upcoming</div>
                    </div>
                    <div style={{ flex: 1, background: '#F9FAFB', borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#374151', fontSize: '1rem' }}>{vStats.pastClasses.length}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>done</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Detail Panel */}
        {selected && stats && (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #EBEBEB', boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'sticky', top: '16px' }}>
            {/* Profile Header */}
            <div style={{ background: 'linear-gradient(135deg, #b91d20 0%, #da2b2e 100%)', padding: '32px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
              <div style={{position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px'}}>
                <button onClick={handleEditClick} style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '14px'}}>edit</span> Edit</button>
                <button onClick={() => {setFormError(''); setIsDeleteModalOpen(true);}} style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}><span className="material-symbols-outlined" style={{fontSize: '14px'}}>delete</span> Delete</button>
              </div>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.75rem', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                {selected.profilePicUrl ? (
                   <img src={selected.profilePicUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                   selected.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.375rem', margin: '0 0 4px 0' }}>{selected.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.875rem' }}>{selected.email}</p>
              </div>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Total', value: stats.totalClasses, color: '#374151' },
                  { label: 'Upcoming', value: stats.upcomingClasses.length, color: '#b91d20' },
                  { label: 'Completed', value: stats.pastClasses.length, color: '#059669' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #F3F4F6', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div style={{ paddingTop: '4px', borderTop: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px 0' }}>Contact Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>mail</span>
                    </div>
                    <a href={`mailto:${selected.email}`} onClick={e => e.stopPropagation()} style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9375rem' }}>
                      {selected.email}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B7280' }}>call</span>
                    </div>
                    {selected.phone ? (
                       <a href={`tel:${selected.phone}`} onClick={e => e.stopPropagation()} style={{ color: '#374151', textDecoration: 'none', fontSize: '0.9375rem' }}>{selected.phone}</a>
                    ) : (
                       <span style={{ color: '#9CA3AF', fontSize: '0.9375rem', fontStyle: 'italic' }}>Phone not registered</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Upcoming classes */}
              {stats.upcomingClasses.length > 0 && (
                <div style={{ paddingTop: '4px', borderTop: '1px solid #F3F4F6' }}>
                  <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px 0' }}>Upcoming Classes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.upcomingClasses.slice(0, 5).map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FFF5F5', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>{c.subject}</div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.8125rem', marginTop: '2px' }}>{c.startTime && `${c.startTime} – ${c.endTime}`}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#b91d20', fontSize: '0.8125rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>{c.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past classes */}
              {stats.pastClasses.length > 0 && (
                <div style={{ paddingTop: '4px', borderTop: '1px solid #F3F4F6' }}>
                  <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px 0' }}>Past Classes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.pastClasses.slice(0, 3).map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                        <div style={{ fontWeight: 600, color: '#6B7280', fontSize: '0.9375rem' }}>{c.subject}</div>
                        <div style={{ fontWeight: 600, color: '#9CA3AF', fontSize: '0.8125rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>{c.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.totalClasses === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>event_busy</span>
                  No classes assigned yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Inbox */}
      <div style={{ marginTop: '32px', background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '24px' }}>
        <AdminMessageInbox />
      </div>

      {/* Add Volunteer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Add New Volunteer</span>}
        footer={
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAddVolunteer} disabled={isSubmitting} style={{ flex: 1, background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Adding...' : 'Create Volunteer'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddVolunteer}>
          {formError && <Alert type="error" message={formError} />}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" style={inputStyle} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required placeholder="Volunteer's full name" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address *</label>
            <input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required placeholder="volunteer@example.com" />
          </div>
          <div style={{ marginBottom: '4px' }}>
            <label style={labelStyle}>Initial Password *</label>
            <input type="password" style={inputStyle} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required placeholder="Min 6 characters" minLength={6} />
          </div>
        </form>
      </Modal>

      {/* Edit Volunteer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={<span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Edit Volunteer</span>}
        footer={
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleUpdateVolunteer} disabled={isSubmitting} style={{ flex: 1, background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUpdateVolunteer}>
          {formError && <Alert type="error" message={formError} />}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Full Name *</label>
            <input type="text" style={inputStyle} value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address *</label>
            <input type="email" style={inputStyle} value={editFormData.email} onChange={e => setEditFormData(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Phone Number</label>
            <input type="tel" style={inputStyle} value={editFormData.phone} onChange={e => setEditFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9999999999" />
          </div>
          <div style={{ marginBottom: '4px' }}>
            <label style={labelStyle}>New Password (Optional)</label>
            <input type="password" style={inputStyle} value={editFormData.password} onChange={e => setEditFormData(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep unchanged" minLength={6} />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={<span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#b91d20' }}>Delete Volunteer</span>}
        footer={
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDeleteVolunteer} disabled={isSubmitting} style={{ flex: 1, background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        }
      >
        <div style={{ color: '#374151', lineHeight: '1.6' }}>
          {formError && <Alert type="error" message={formError} />}
          Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone. All classes currently assigned to this volunteer will lose their assignment.
        </div>
      </Modal>
    </div>
  );
}
