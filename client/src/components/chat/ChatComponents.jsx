import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messagesAPI } from '../../services/api';

// Floating chat button for volunteers to send messages to admin
export function VolunteerChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await messagesAPI.send(text.trim());
      setText('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      setError('Failed to send. Try again.');
    }
    setSending(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000,
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#b91d20', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(185,29,32,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 200ms',
        }}
        title="Message Admin"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'white' }}>
          {open ? 'close' : 'chat'}
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '28px', zIndex: 999,
          width: '320px', background: 'white', borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid #EBEBEB',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: '#b91d20', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'white' }}>support_agent</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>Message Admin</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>Send a request or suggestion</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '16px' }}>
            {sent ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#16A34A', display: 'block', marginBottom: '6px' }}>check_circle</span>
                <div style={{ fontWeight: 700, color: '#15803D', fontSize: '0.875rem' }}>Message sent!</div>
                <div style={{ color: '#6B7280', fontSize: '0.75rem', marginTop: '4px' }}>Admin will review your message.</div>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); setError(''); }}
                  placeholder="Type your request or suggestion here..."
                  rows={4}
                  style={{
                    width: '100%', borderRadius: '10px', border: '1px solid #E5E7EB',
                    padding: '10px 12px', fontSize: '0.875rem', fontFamily: 'inherit',
                    resize: 'none', outline: 'none', boxSizing: 'border-box',
                    color: '#111827', background: '#F9FAFB',
                  }}
                />
                {error && <div style={{ color: '#b91d20', fontSize: '0.75rem', marginTop: '6px' }}>{error}</div>}
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  style={{
                    width: '100%', marginTop: '10px', background: '#b91d20', color: 'white',
                    border: 'none', borderRadius: '10px', padding: '10px', fontWeight: 700,
                    fontSize: '0.875rem', cursor: 'pointer', opacity: (sending || !text.trim()) ? 0.6 : 1,
                  }}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Admin inbox panel — embedded in a page section
export function AdminMessageInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await messagesAPI.getAll();
      setMessages(res.messages || []);
    } catch (e) { /* admin only */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await messagesAPI.markRead(id);
    setMessages(prev => prev.map(m => m._id === id ? { ...m, isRead: true } : m));
  };

  const unread = messages.filter(m => !m.isRead).length;

  if (loading) return <div style={{ padding: '24px', color: '#9CA3AF', fontSize: '0.875rem' }}>Loading messages...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Volunteer Messages</h3>
        {unread > 0 && (
          <span style={{ background: '#b91d20', color: 'white', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
            {unread} new
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '0.875rem' }}>
          No messages from volunteers yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
          {messages.map(msg => (
            <div key={msg._id} style={{
              background: msg.isRead ? '#FAFAFA' : '#FFF5F5',
              border: `1px solid ${msg.isRead ? '#F3F4F6' : '#FEE2E2'}`,
              borderRadius: '12px', padding: '14px 16px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.isRead ? '#F3F4F6' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: msg.isRead ? '#9CA3AF' : '#b91d20' }}>person</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{msg.senderName}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>
                    {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5, margin: 0 }}>{msg.text}</p>
                {!msg.isRead && (
                  <button onClick={() => markRead(msg._id)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#b91d20', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
