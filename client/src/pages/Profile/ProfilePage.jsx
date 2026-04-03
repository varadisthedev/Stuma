import { useState, useEffect, useRef } from 'react';
import { photosAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ListPageSkeleton } from '../../components/ui/Skeleton';

const RED = '#b91d20';
const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '24px' };

export default function ProfilePage() {
  const { user, teacher, logout } = useAuth();
  const currentUser = user || teacher;
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [isCapturingPic, setIsCapturingPic] = useState(false);
  const [picStream, setPicStream] = useState(null);
  const [picCaptured, setPicCaptured] = useState(null);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [picMsg, setPicMsg] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        console.log('[PROFILE PAGE] Loading profile...');
        const res = await photosAPI.getProfile();
        if (res.success) {
          setProfile(res.user);
          setEditName(res.user.name);
          setEditPhone(res.user.phone || '');
        }
      } catch (err) {
        console.error('[PROFILE PAGE] Load error:', err);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  // Start camera for profile pic
  const startPicCam = async () => {
    setIsCapturingPic(true);
    setPicCaptured(null);
    setPicMsg('');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
      setPicStream(s);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 100);
      console.log('[PROFILE PIC] Camera started');
    } catch (err) {
      console.error('[PROFILE PIC] Camera error:', err);
      setPicMsg('Could not access camera: ' + err.message);
      setIsCapturingPic(false);
    }
  };

  const capturePic = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 640;
    c.getContext('2d').drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.9);
    setPicCaptured(dataUrl);
    if (picStream) picStream.getTracks().forEach(t => t.stop());
    setPicStream(null);
    console.log('[PROFILE PIC] Captured');
  };

  const uploadPic = async () => {
    if (!picCaptured) return;
    setIsUploadingPic(true);
    setPicMsg('');
    try {
      console.log('[PROFILE PIC] Uploading...');
      const res = await photosAPI.uploadProfilePic(picCaptured);
      if (res.success) {
        setProfile(prev => ({ ...prev, profilePicUrl: res.profilePicUrl }));
        setPicMsg('Profile picture updated!');
        setIsCapturingPic(false);
        setPicCaptured(null);
        console.log('[PROFILE PIC] Upload success:', res.profilePicUrl);
      }
    } catch (err) {
      console.error('[PROFILE PIC] Upload error:', err);
      setPicMsg('Upload failed: ' + err.message);
    }
    setIsUploadingPic(false);
  };

  // Also support file upload for profile pic
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPicCaptured(reader.result);
    reader.readAsDataURL(file);
    setIsCapturingPic(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setSaveMsg('');
    try {
      const res = await photosAPI.updateProfile({ name: editName, phone: editPhone });
      if (res.success) {
        setProfile(prev => ({ ...prev, name: res.user.name, phone: res.user.phone }));
        setIsEditing(false);
        setSaveMsg('Profile saved!');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } catch (err) {
      setSaveMsg('Failed to save: ' + err.message);
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    console.log('[PROFILE] Logging out...');
    logout();
    navigate('/login');
  };

  if (isLoading) return <ListPageSkeleton />;

  const initials = (profile?.name || currentUser?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>My Profile</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '2px', background: RED }} />
          <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* LEFT: Profile Card */}
        <div>
          <div style={{ ...card, textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              {profile?.profilePicUrl ? (
                <img src={profile.profilePicUrl} alt="Profile" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${RED}` }} />
              ) : (
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', margin: '0 auto' }}>
                  {initials}
                </div>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>{profile?.name || currentUser?.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '4px' }}>{profile?.email || currentUser?.email}</div>
            <div style={{ display: 'inline-block', background: profile?.role === 'admin' ? '#FEF2F2' : '#EFF6FF', color: profile?.role === 'admin' ? RED : '#1D4ED8', fontWeight: 700, fontSize: '0.75rem', borderRadius: '20px', padding: '4px 12px', marginTop: '10px', textTransform: 'capitalize' }}>
              {profile?.role || currentUser?.role}
            </div>
            {profile?.phone && (
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '10px' }}>📞 {profile.phone}</div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px' }}>
              Joined {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
            </div>

            {picMsg && (
              <div style={{ margin: '12px 0 0', fontSize: '0.8125rem', color: picMsg.includes('fail') || picMsg.includes('error') ? RED : '#16A34A', background: picMsg.includes('fail') || picMsg.includes('error') ? '#FEF2F2' : '#F0FDF4', borderRadius: '8px', padding: '8px' }}>
                {picMsg}
              </div>
            )}

            {/* Profile Pic Upload Section */}
            {!isCapturingPic ? (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={startPicCam} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '10px', padding: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  📷 Take Photo
                </button>
                <label style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '10px', padding: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'block' }}>
                  🖼️ Upload from Gallery
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                {!picCaptured ? (
                  <>
                    <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', background: '#111827', aspectRatio: '1/1' }}>
                      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted playsInline />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { if (picStream) picStream.getTracks().forEach(t => t.stop()); setIsCapturingPic(false); }} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={capturePic} style={{ flex: 1, background: RED, color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: 700, cursor: 'pointer' }}>📸 Snap</button>
                    </div>
                  </>
                ) : (
                  <>
                    <img src={picCaptured} alt="Preview" style={{ width: '100%', borderRadius: '10px', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setPicCaptured(null); setIsCapturingPic(false); }} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={uploadPic} disabled={isUploadingPic} style={{ flex: 1, background: RED, color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: 700, cursor: isUploadingPic ? 'not-allowed' : 'pointer', opacity: isUploadingPic ? 0.7 : 1 }}>
                        {isUploadingPic ? 'Saving...' : '✅ Save'}
                      </button>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
              <button onClick={handleLogout} style={{ width: '100%', background: '#FEF2F2', color: RED, border: `1px solid #FEE2E2`, borderRadius: '10px', padding: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Edit Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>Account Information</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </div>

            {saveMsg && (
              <div style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: '8px', padding: '8px 12px', marginBottom: '16px', fontSize: '0.875rem' }}>{saveMsg}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Full Name', value: profile?.name, edit: isEditing, val: editName, set: setEditName, type: 'text' },
                { label: 'Email Address', value: profile?.email, readonly: true },
                { label: 'Phone Number', value: profile?.phone || 'Not set', edit: isEditing, val: editPhone, set: setEditPhone, type: 'tel' },
                { label: 'Role', value: profile?.role, readonly: true },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{f.label}</div>
                  {f.edit ? (
                    <input
                      type={f.type || 'text'}
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontSize: '0.9rem', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <div style={{ fontSize: '0.9375rem', color: '#111827', fontWeight: 600 }}>{f.value}</div>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveProfile} disabled={isSaving} style={{ flex: 2, background: RED, color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Security card */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>Security</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Password</div>
                <div style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>Last changed: unknown</div>
              </div>
              <button style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '8px 14px', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
                Change
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
