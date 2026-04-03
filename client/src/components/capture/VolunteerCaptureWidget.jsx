import { useState, useRef, useEffect, useCallback } from 'react';
import { photosAPI, classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/helpers';

const RED = '#b91d20';
const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', padding: '24px' };

/**
 * Volunteer Class Capture Widget
 * - Opens webcam (no file picker)
 * - Requires a matching current active class
 * - Geotags the image
 * - Sends base64 + metadata to backend
 */
export function VolunteerCaptureWidget() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null); // base64 data URL
  const [activeClass, setActiveClass] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const myId = currentUser?._id || currentUser?.id;

  // Find currently active class for this volunteer
  useEffect(() => {
    if (!isOpen) return;
    const findActiveClass = async () => {
      try {
        const now = new Date();
        // Use LOCAL date (not UTC) to match class dates stored in local timezone
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTotalMins = currentHour * 60 + currentMin;

        console.log('[CAPTURE] Today local date:', todayStr, '| Current time:', `${currentHour}:${String(currentMin).padStart(2,'0')}`, '| VolunteerID:', myId);

        const res = await classesAPI.getAll();
        const allClasses = res.classes || [];
        console.log('[CAPTURE] Total classes fetched:', allClasses.length);

        const mine = allClasses.filter(c => {
          const isAssigned = c.assignedVolunteer && 
            (c.assignedVolunteer._id === myId || c.assignedVolunteer === myId);
          const isToday = c.date === todayStr;
          console.log(`[CAPTURE] Class: ${c.subject} | date=${c.date} | todayStr=${todayStr} | isToday=${isToday} | isAssigned=${isAssigned}`);
          return isAssigned && isToday;
        });

        console.log('[CAPTURE] My classes today:', mine.length);

        const active = mine.find(c => {
          const [sh, sm] = c.startTime.split(':').map(Number);
          const [eh, em] = c.endTime.split(':').map(Number);
          const startMins = sh * 60 + sm;
          const endMins = eh * 60 + em;
          // Allow capture 10 mins before start and until end
          const earlyStartMins = startMins - 10;
          const inWindow = currentTotalMins >= earlyStartMins && currentTotalMins <= endMins;
          console.log(`[CAPTURE] Checking ${c.subject}: window=${c.startTime}-${c.endTime} | currentMins=${currentTotalMins} | earlyStart=${earlyStartMins} | endMins=${endMins} | inWindow=${inWindow}`);
          return inWindow;
        });

        console.log('[CAPTURE] Active class:', active ? `${active.subject} (${active._id})` : 'NONE');
        setActiveClass(active || null);
        if (!active) {
          const timeStr = `${String(currentHour).padStart(2,'0')}:${String(currentMin).padStart(2,'0')}`;
          if (mine.length === 0) {
            setError(`No classes assigned to you today (${todayStr}). Your camera is open but photos can only be uploaded during your class.`);
          } else {
            setError(`Camera open — but you're outside your class window right now (${timeStr}). Upload is only allowed during class hours.`);
          }
        } else {
          setError('');
        }
      } catch (err) {
        console.error('[CAPTURE] Error finding active class:', err);
        setError('Failed to fetch classes. Camera is still open — check console for details.');
      }
    };
    findActiveClass();
  }, [isOpen, myId]);

  // Request geolocation
  useEffect(() => {
    if (!isOpen) return;
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by browser.');
      return;
    }
    console.log('[CAPTURE] Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        console.log('[CAPTURE] Got location:', pos.coords.latitude, pos.coords.longitude);
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      err => {
        console.warn('[CAPTURE] Geolocation error:', err.message);
        setLocationError('Could not get location: ' + err.message);
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOpen]);

  // Start webcam - always start when modal opens, don't require active class
  useEffect(() => {
    if (!isOpen || captured) return;
    const startCam = async () => {
      try {
        console.log('[CAPTURE] Requesting camera permission and starting webcam...');
        // Explicitly request camera permission
        const permResult = await navigator.permissions.query({ name: 'camera' }).catch(() => null);
        console.log('[CAPTURE] Camera permission state:', permResult?.state);
        
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(e => console.warn('[CAPTURE] video.play() error:', e));
        }
        console.log('[CAPTURE] Webcam started successfully');
        setError('');
      } catch (err) {
        console.error('[CAPTURE] Webcam error:', err.name, err.message);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings and refresh.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Could not access camera: ' + err.message);
        }
      }
    };
    startCam();
    return () => {};
  }, [isOpen, captured]);

  const stopCam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  const close = useCallback(() => {
    stopCam();
    setIsOpen(false);
    setCaptured(null);
    setError('');
    setUploadSuccess(false);
  }, [stopCam]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Bake timestamp + location overlay onto image
    const now = new Date();
    const timeStr = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' });
    const locStr = location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Location N/A';
    const classStr = activeClass ? `${activeClass.subject} | ${formatTime(activeClass.startTime)}–${formatTime(activeClass.endTime)}` : '';

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, canvas.height - 72, canvas.width, 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.fillText(`📍 ${locStr}`, 14, canvas.height - 48);
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`🕐 ${timeStr}  |  ${classStr}`, 14, canvas.height - 20);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('[CAPTURE] Image captured, size:', Math.round(dataUrl.length / 1024), 'KB');
    setCaptured(dataUrl);
    stopCam();
  }, [location, activeClass, stopCam]);

  const upload = async () => {
    if (!captured || !activeClass) return;
    setIsUploading(true);
    setError('');
    try {
      console.log('[CAPTURE] Sending to backend...');
      const res = await photosAPI.uploadCapture({
        imageBase64: captured,
        classId: activeClass._id,
        location: location || {},
        takenAt: new Date().toISOString(),
        metadata: {
          classDate: activeClass.date,
          classTime: `${activeClass.startTime}-${activeClass.endTime}`,
          subject: activeClass.subject,
        },
      });
      console.log('[CAPTURE] Upload success:', res);
      setUploadSuccess(true);
      setTimeout(() => close(), 2500);
    } catch (err) {
      console.error('[CAPTURE] Upload failed:', err);
      setError('Upload failed: ' + (err.response?.data?.message || err.message));
    }
    setIsUploading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        title="Capture attendance photo"
        style={{ position: 'fixed', bottom: '100px', right: '24px', width: '56px', height: '56px', borderRadius: '50%', background: RED, color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(185,29,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 998, fontSize: '24px' }}
      >
        📷
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '560px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#111827', fontSize: '1.25rem' }}>📷 Class Photo Capture</h3>
                {activeClass && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#6B7280' }}>
                    {activeClass.subject} · {formatTime(activeClass.startTime)}–{formatTime(activeClass.endTime)}
                  </p>
                )}
              </div>
              <button onClick={close} style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Error */}
            {error && <div style={{ background: '#FEF2F2', color: RED, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}

            {/* Success */}
            {uploadSuccess && (
              <div style={{ background: '#F0FDF4', color: '#16A34A', borderRadius: '10px', padding: '16px', textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>
                ✅ Photo uploaded successfully!
              </div>
            )}

            {!uploadSuccess && (
              <>
                {/* Location status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.8125rem', color: location ? '#16A34A' : '#D97706' }}>
                  <span>{location ? '📍' : '⏳'}</span>
                  <span>{location ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : locationError || 'Getting location...'}</span>
                </div>

                {/* Webcam or captured preview */}
                {!captured ? (
                  <>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#111827', aspectRatio: '16/9', marginBottom: '16px', position: 'relative' }}>
                      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} muted playsInline autoPlay />
                      {!stream && !error && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '0.875rem', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '2rem' }}>📷</span>
                          <span>Starting camera...</span>
                        </div>
                      )}
                    </div>
                    {!activeClass && (
                      <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.8125rem', color: '#92400E' }}>
                        ⚠️ No active class found at this time. Photos can only be uploaded during your scheduled class window.
                      </div>
                    )}
                    <button
                      onClick={capture}
                      disabled={!stream}
                      style={{ width: '100%', background: stream ? RED : '#E5E7EB', color: stream ? 'white' : '#9CA3AF', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: stream ? 'pointer' : 'not-allowed' }}
                    >
                      📸 Take Photo
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                      <img src={captured} alt="Captured" style={{ width: '100%', display: 'block', borderRadius: '12px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => { setCaptured(null); }} style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        🔄 Retake
                      </button>
                      <button onClick={upload} disabled={isUploading} style={{ flex: 2, background: RED, color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 700, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
                        {isUploading ? 'Uploading...' : '✅ Upload Photo'}
                      </button>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
