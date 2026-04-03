import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import renovatioLogo from '../../assets/brandings/renovatioLogo.png';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Login Page - Renovatio Foundation
 * Exact implementation of the Google Stitch Design provided by the User
 * ═══════════════════════════════════════════════════════════════════════════
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [loginRole, setLoginRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  /**
   * Handle login submit
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    console.log(`[LOGIN] Attempting login as ${loginRole}`);
    
    const result = await login(loginForm.email, loginForm.password, loginRole);
    
    if (result.success) {
      console.log('[LOGIN] Login successful, redirecting to dashboard');
      navigate('/dashboard');
    } else {
      console.log('[LOGIN] Login failed:', result.message);
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="font-body bg-gray-100 min-h-screen flex flex-col" style={{ backgroundColor: '#f4f6f8' }}>
      <main className="flex-grow flex items-center justify-center p-6" style={{ padding: '1.5rem' }}>
        <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-2xl" style={{ minHeight: '600px' }}>
          {/* Branding/Visual Side */}
          <div className="hidden md:flex flex-col justify-between p-12 relative" style={{ background: '#b91d20', padding: '3.5rem' }}>
            <div className="relative z-10">
              <div className="text-white mb-12 flex items-center" style={{ marginBottom: '4rem' }}>
                <img src={renovatioLogo} alt="Renovatio Foundation" className="w-auto h-auto bg-white rounded-xl p-2" style={{ width: '14rem', height: 'auto', backgroundColor: 'white', borderRadius: '0.75rem', padding: '0.75rem' }} />
              </div>
              <h1 className="font-headline font-semibold text-4xl text-white leading-tight tracking-tight mb-6" style={{ fontSize: '2.5rem', lineHeight: '1.2', marginBottom: '1.5rem' }}>
                Securing the Future<br />Through Dedicated Service.
              </h1>
              <p className="text-white opacity-90 text-sm leading-relaxed max-w-sm" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                Welcome to the Attendance Portal. Please authenticate to access your dashboard and manage sessions.
              </p>
            </div>
            
            {/* Abstract Decorative Image Overlay */}
            <div className="absolute inset-0 z-0">
              {/* Added a solid overlay with multiply over the image to give it the deep red finish */}
              <div className="absolute inset-0 bg-red-700 mix-blend-multiply opacity-50" style={{ backgroundColor: '#b91d20' }}></div>
              <img 
                alt="abstract composition" 
                className="w-full h-full object-cover opacity-30 mix-blend-screen" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAR9eGGhHcjUGrtlFpMiTyk28bbAmTQwc2Uju_6xsfsV8o8iKqSL85M0Ian0UsMMllMXBatlFPe6jqTWIxtDrI4TD170rJu9SjZXxzxO57rV-H3bUx4_h_m_zEv1vASkDffdSuSAx1WCcLbuvCfqNJks0K6govyqJ_AQ71G8K3IIQejIIxjBY2UGIs7pBNALaofcIVhLcsviQwa0HMWJhd8QN8uS7xAy79YtiNmDO7blyIr3YcrmkLReBIoGhU5yuLHUZSG6iGA" 
              />
            </div>

            <div className="relative z-10 mt-12" style={{ marginTop: '3rem' }}>
              <div className="flex items-center space-x-3 text-white" style={{ gap: '0.75rem' }}>
                <span className="material-symbols-outlined text-xl">verified_user</span>
                <span className="font-label text-xs uppercase tracking-widest font-medium opacity-90">Enterprise Secure Access</span>
              </div>
            </div>
          </div>

          {/* Login Content Side */}
          <div className="p-10 md:p-14 flex flex-col justify-center bg-white" style={{ padding: '3.5rem' }}>
            <div className="mb-8" style={{ marginBottom: '2rem' }}>
              <h2 className="font-headline font-bold text-3xl text-gray-900 tracking-tight" style={{ fontSize: '1.75rem' }}>Portal Login</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials below</p>
            </div>

            {/* Error Space */}
            {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

            {/* Tabs */}
            <div className="flex bg-gray-50 p-1.5 rounded-lg mb-8" style={{ backgroundColor: '#f8f9fa', padding: '0.375rem', marginBottom: '2rem' }}>
              <button 
                type="button"
                onClick={() => { setLoginRole('admin'); setError(''); }}
                className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-all duration-200 ${
                  loginRole === 'admin' 
                  ? 'bg-white font-semibold shadow-sm text-red-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium'
                }`}
                style={{ padding: '0.75rem 1rem', gap: '0.5rem', color: loginRole === 'admin' ? '#b91d20' : undefined }}
              >
                <span className="material-symbols-outlined text-lg">deployed_code</span>
                <span className="text-xs uppercase tracking-wider font-semibold">Admin Access</span>
              </button>
              <button 
                type="button"
                onClick={() => { setLoginRole('volunteer'); setError(''); }}
                className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center space-x-2 transition-all duration-200 ${
                  loginRole === 'volunteer' 
                  ? 'bg-white font-semibold shadow-sm text-red-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium'
                }`}
                style={{ padding: '0.75rem 1rem', gap: '0.5rem', color: loginRole === 'volunteer' ? '#b91d20' : undefined }}
              >
                <span className="material-symbols-outlined text-lg">volunteer_activism</span>
                <span className="text-xs uppercase tracking-wider font-semibold">Volunteer Access</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email" style={{ marginBottom: '0.5rem' }}>
                  Institutional Email
                </label>
                <input 
                  className="w-full bg-gray-100 border border-transparent focus:border-gray-300 rounded-md px-4 py-3 transition-colors outline-none text-gray-900 text-sm"
                  style={{ backgroundColor: '#f4f6f8', padding: '0.875rem 1rem' }} 
                  id="email" 
                  name="email" 
                  autoComplete="username email"
                  placeholder={loginRole === 'admin' ? "name@renovatio.org" : "volunteer@renovatio.org"}
                  type="email" 
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2" style={{ marginBottom: '0.5rem' }}>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                    Security Password
                  </label>
                  <a className="text-xs font-medium hover:underline text-red-700" style={{ color: '#b91d20' }} href="#">Forgot Access?</a>
                </div>
                <input 
                  className="w-full bg-gray-100 border border-transparent focus:border-gray-300 rounded-md px-4 py-3 transition-colors outline-none text-gray-900 text-sm" 
                  style={{ backgroundColor: '#f4f6f8', padding: '0.875rem 1rem' }} 
                  id="password" 
                  name="password" 
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="pt-2">
                <button 
                  className="w-full py-3 bg-red-700 text-white text-sm font-bold rounded-md hover:bg-red-800 transition-colors" 
                  style={{ backgroundColor: '#b91d20', padding: '0.875rem' }}
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                </button>
              </div>
            </form>

            <div className="mt-10 text-center" style={{ marginTop: '2.5rem' }}>
              <p className="text-gray-500 text-xs">
                By logging in, you agree to our{' '}
                <a className="font-medium hover:underline text-red-700" style={{ color: '#b91d20' }} href="#">Terms of Service</a>{' '}
                and{' '}
                <a className="font-medium hover:underline text-red-700" style={{ color: '#b91d20' }} href="#">Data Protection Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 bg-white flex flex-col md:flex-row justify-between items-center px-10" style={{ padding: '1.5rem 2.5rem' }}>
        <div className="mb-4 md:mb-0 flex items-center space-x-3" style={{ gap: '0.75rem' }}>
          <span className="font-headline font-bold text-sm text-red-700" style={{ color: '#b91d20' }}>Renovatio Foundation</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">© 2024 Renovatio Foundation. All Rights Reserved.</span>
        </div>
        <div className="flex space-x-6" style={{ gap: '1.5rem' }}>
          <a className="text-xs text-gray-400 hover:text-gray-600 transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs text-gray-400 hover:text-gray-600 transition-colors" href="#">Terms of Service</a>
          <a className="text-xs text-gray-400 hover:text-gray-600 transition-colors" href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}
