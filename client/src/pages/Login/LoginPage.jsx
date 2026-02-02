/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Login Page - Ramdeobaba University
 * Authentication page with login and registration tabs
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import universityLogo from '../../assets/logo.jpg';
import wallpaper from '../../assets/wallpaper.jpg';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });

  /**
   * Handle login submit
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    console.log('[LOGIN] Attempting login');
    
    const result = await login(loginForm.email, loginForm.password);
    
    if (result.success) {
      console.log('[LOGIN] Login successful, redirecting to dashboard');
      navigate('/dashboard');
    } else {
      console.log('[LOGIN] Login failed:', result.message);
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  /**
   * Handle registration submit
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    console.log('[LOGIN] Attempting registration');
    
    // Validation
    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }
    
    const result = await register(
      registerForm.name,
      registerForm.email,
      registerForm.password
    );
    
    if (result.success) {
      console.log('[LOGIN] Registration successful');
      setSuccess('Account created successfully! Please login.');
      setActiveTab('login');
      setLoginForm({ email: registerForm.email, password: '' });
      setRegisterForm({ name: '', email: '', password: '' });
    } else {
      console.log('[LOGIN] Registration failed:', result.message);
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Decorative Background */}
      <div style={styles.bgPattern}></div>
      <div style={styles.bgGlow1}></div>
      <div style={styles.bgGlow2}></div>
      
      {/* Decorative Circles */}
      <svg style={styles.decorCircle1} viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.3" />
      </svg>
      <svg style={styles.decorCircle2} viewBox="0 0 150 150" fill="none">
        <circle cx="75" cy="75" r="65" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
      </svg>

      {/* Main Card */}
      <div style={styles.card} className="animate-fade-in">
        {/* University Header */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img 
              src={universityLogo} 
              alt="Ramdeobaba University" 
              style={styles.logoImage}
            />
          </div>
          <div style={styles.universityInfo}>
            <h1 style={styles.universityName}>Ramdeobaba University</h1>
            <p style={styles.portalName}>Faculty Attendance Portal</p>
          </div>
        </div>

        {/* Blue Divider */}
        <div style={styles.divider}></div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'login' && styles.tabActive),
            }}
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'register' && styles.tabActive),
            }}
            onClick={() => { setActiveTab('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} style={{ margin: '0 1.5rem 1rem' }} />}
        {success && <Alert type="success" message={success} style={{ margin: '0 1.5rem 1rem' }} />}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="faculty@rbu.edu.in"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              style={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" style={{ borderTopColor: 'white' }}></span>
                  Signing in...
                </>
              ) : (
                'Sign In to Portal'
              )}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dr. John Doe"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
                minLength={2}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="faculty@rbu.edu.in"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              style={{...styles.submitBtn, ...styles.submitBtnAlt}}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" style={{ borderTopColor: 'white' }}></span>
                  Creating account...
                </>
              ) : (
                'Create Faculty Account'
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerDivider}></div>
          <p style={styles.footerText}>
            Secure attendance management for Ramdeobaba University faculty
          </p>
          <p style={styles.footerCopyright}>
            © 2026 Ramdeobaba University. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `linear-gradient(135deg, rgba(9, 65, 109, 0.85) 0%, rgba(9, 65, 109, 0.7) 50%, rgba(175, 121, 160, 0.6) 100%), url(${wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  bgPattern: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(9, 65, 109, 0.03) 1px, transparent 0)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  bgGlow1: {
    position: 'absolute',
    top: '-15%',
    right: '-10%',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(9, 65, 109, 0.12) 0%, transparent 60%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-15%',
    width: '700px',
    height: '700px',
    background: 'radial-gradient(circle, rgba(187, 187, 227, 0.25) 0%, transparent 60%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  decorCircle1: {
    position: 'absolute',
    top: '5%',
    right: '8%',
    width: '200px',
    height: '200px',
    color: 'rgba(9, 65, 109, 0.08)',
    pointerEvents: 'none',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: '10%',
    left: '5%',
    width: '150px',
    height: '150px',
    color: 'rgba(175, 121, 160, 0.1)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2.5rem 0 2rem',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 20px 60px rgba(9, 65, 109, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    padding: '0 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '16px',
    overflow: 'hidden',
    background: 'white',
    padding: '4px',
    boxShadow: '0 4px 16px rgba(9, 65, 109, 0.15)',
    marginBottom: '1rem',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  universityInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  universityName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#09416D',
    margin: 0,
    lineHeight: 1.2,
  },
  portalName: {
    color: '#6B7280',
    fontSize: '0.9375rem',
    margin: 0,
    fontWeight: 500,
  },
  divider: {
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #09416D, rgba(9, 65, 109, 0.5), transparent)',
    margin: '0 2rem 1.5rem',
    borderRadius: '2px',
  },
  tabs: {
    display: 'flex',
    margin: '0 2rem 1.5rem',
    background: 'rgba(9, 65, 109, 0.06)',
    borderRadius: '12px',
    padding: '4px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#6B7280',
    transition: 'all 200ms ease',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #09416D 0%, #0A5A94 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(9, 65, 109, 0.25)',
  },
  form: {
    padding: '0 2rem',
  },
  submitBtn: {
    width: '100%',
    marginTop: '0.5rem',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #09416D 0%, #0A5A94 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 16px rgba(9, 65, 109, 0.3)',
    transition: 'all 200ms ease',
  },
  submitBtnAlt: {
    background: 'linear-gradient(135deg, #AF79A0 0%, #C294B6 100%)',
    boxShadow: '0 4px 16px rgba(175, 121, 160, 0.3)',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    padding: '0 2rem',
  },
  footerDivider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(180, 184, 197, 0.4), transparent)',
    marginBottom: '1rem',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: '0.75rem',
    margin: '0 0 4px 0',
  },
  footerCopyright: {
    color: '#B4B8C5',
    fontSize: '0.6875rem',
    margin: 0,
  },
};
