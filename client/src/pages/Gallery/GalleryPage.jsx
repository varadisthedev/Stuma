import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { photosAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GridPageSkeleton } from '../../components/ui/Skeleton';

const RED = '#b91d20';
const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '24px' };

export default function GalleryPage() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const isAdmin = currentUser?.role === 'admin';

  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterVolunteer, setFilterVolunteer] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        console.log('[GALLERY] Loading photos...');
        const res = await photosAPI.getGallery();
        console.log('[GALLERY] Received', res.photos?.length, 'photos');
        setPhotos(res.photos || []);
      } catch (err) {
        console.error('[GALLERY] Error:', err);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to completely delete this photo from the database and Cloudinary? This action cannot be undone.')) {
      return;
    }
    try {
      await photosAPI.deletePhoto(selected._id);
      setPhotos((prev) => prev.filter(p => p._id !== selected._id));
      setSelected(null);
    } catch (err) {
      console.error('Failed to delete photo', err);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const volunteers = isAdmin
    ? [...new Map(photos.map(p => [p.volunteer?._id, { id: p.volunteer?._id, name: p.volunteer?.name }])).values()].filter(v => v.id)
    : [];

  const filtered = filterVolunteer === 'all' ? photos : photos.filter(p => p.volunteer?._id === filterVolunteer);

  if (isLoading) return <GridPageSkeleton />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isAdmin ? 'Volunteer Gallery' : 'My Captures'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', background: RED }} />
            <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>
              {filtered.length} geotagged class {filtered.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>

        {isAdmin && volunteers.length > 0 && (
          <select
            value={filterVolunteer}
            onChange={e => setFilterVolunteer(e.target.value)}
            style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', fontSize: '0.875rem', color: '#111827', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Volunteers</option>
            {volunteers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ width: '72px', height: '72px', background: '#FEF2F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px' }}>📷</div>
          <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827', marginBottom: '8px' }}>No photos yet</h3>
          <p style={{ color: '#6B7280', margin: 0 }}>
            {isAdmin ? 'Volunteers have not uploaded any class photos yet.' : 'Take your first class photo during an active class.'}
          </p>
        </div>
      ) : (
        <div style={{ columns: '3 280px', gap: '16px' }}>
          {filtered.map(photo => (
            <div
              key={photo._id}
              onClick={() => setSelected(photo)}
              style={{ breakInside: 'avoid', marginBottom: '16px', cursor: 'pointer', borderRadius: '14px', overflow: 'hidden', border: '1px solid #EBEBEB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 150ms, box-shadow 150ms', background: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
            >
              <img src={photo.imageUrl} alt="Class capture" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
              <div style={{ padding: '10px 12px' }}>
                {isAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {photo.volunteer?.profilePicUrl ? (
                      <img src={photo.volunteer.profilePicUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 800 }}>
                        {(photo.volunteer?.name || 'V')[0]}
                      </div>
                    )}
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#374151' }}>{photo.volunteer?.name || 'Unknown'}</span>
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {photo.metadata?.subject || photo.class?.subject || 'Class'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
                  {photo.location?.lat ? (
                    <a href={`https://www.google.com/maps?q=${photo.location.lat},${photo.location.lng}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.75rem', color: '#1D4ED8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      📍 {photo.location.lat.toFixed(4)}, {photo.location.lng.toFixed(4)}
                    </a>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>📍 Location N/A</div>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                  🕐 {new Date(photo.takenAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && createPortal(
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'transparent', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5vh 20px', overflowY: 'auto' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08)', borderRadius: '20px', overflowY: 'auto', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', margin: 'auto' }}
          >
            <img src={selected.imageUrl} alt="Full size" style={{ width: '100%', height: 'auto', maxHeight: '70vh', display: 'block', objectFit: 'contain' }} />
            <div style={{ padding: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: '12px' }}>
                {selected.metadata?.subject || selected.class?.subject}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {isAdmin && (
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Volunteer</div>
                    <div style={{ fontWeight: 600, color: '#374151' }}>{selected.volunteer?.name}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Taken At</div>
                  <div style={{ fontWeight: 600, color: '#374151' }}>{new Date(selected.takenAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' })}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Location</div>
                  <div style={{ fontWeight: 600, color: '#374151' }}>
                    {selected.location?.lat ? `${selected.location.lat.toFixed(5)}, ${selected.location.lng.toFixed(5)}` : 'Not available'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Class Time</div>
                  <div style={{ fontWeight: 600, color: '#374151' }}>{selected.metadata?.classTime || '—'}</div>
                </div>
              </div>
              {selected.location?.lat && (
                <a
                  href={`https://www.google.com/maps?q=${selected.location.lat},${selected.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px 14px', textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem' }}
                >
                  🗺️ View on Google Maps
                </a>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                {isAdmin && (
                  <button onClick={handleDelete} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                )}
                <button onClick={() => setSelected(null)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
