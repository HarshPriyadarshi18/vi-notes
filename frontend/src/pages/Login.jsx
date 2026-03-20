import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import '../styles/Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);

      // Show success message briefly then go to editor
      setSuccess(true);
      setTimeout(() => {
        navigate('/editor');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>✍️</div>
          <h1 style={styles.logoText}>Vi-Notes</h1>
          <p style={styles.tagline}>Authenticity verification for writing</p>
        </div>

        {/* Success Message */}
        {success ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✅</div>
            <p style={styles.successTitle}>Login Successful!</p>
            <p style={styles.successSub}>Opening your editor...</p>
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrap}>
                <span style={styles.icon}>📧</span>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <span style={styles.icon}>🔒</span>
                <input
                  style={{ ...styles.input, paddingRight: '40px' }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Logging in...' : 'Login →'}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Register link */}
            <p style={styles.switchText}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.link}>Create one</Link>
            </p>

          </form>
        )}

      </div>

      {/* Progress bar animation */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
    padding: '16px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
  },
  logoWrap: { textAlign: 'center', marginBottom: '32px' },
  logoIcon: { fontSize: '36px', marginBottom: '8px' },
  logoText: {
    fontSize: '26px', fontWeight: '700',
    color: '#1a1a18', margin: '0 0 6px',
  },
  tagline: { fontSize: '13px', color: '#888', margin: 0 },
  // Success styles
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { fontSize: '52px', marginBottom: '16px' },
  successTitle: {
    fontSize: '20px', fontWeight: '700',
    color: '#27ae60', margin: '0 0 8px',
  },
  successSub: { fontSize: '13px', color: '#888', margin: '0 0 24px' },
  progressBar: {
    height: '4px', background: '#e8e6e0',
    borderRadius: '4px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: '#27ae60',
    borderRadius: '4px',
    animation: 'progress 1.5s linear forwards',
  },
  // Form styles
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#444' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: {
    position: 'absolute', left: '12px',
    fontSize: '15px', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '11px 12px 11px 38px',
    borderRadius: '10px', border: '1.5px solid #e0deda',
    fontSize: '14px', outline: 'none',
    color: '#1a1a18', background: '#fafaf8',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: '10px',
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: '16px',
    padding: '0', lineHeight: 1,
  },
  errorBox: {
    background: '#fff0f0', border: '1px solid #ffd0d0',
    borderRadius: '8px', padding: '10px 14px',
    fontSize: '13px', color: '#c0392b',
  },
  btn: {
    padding: '13px', background: '#1a1a18',
    color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '15px',
    fontWeight: '600', marginTop: '4px',
  },
  divider: {
    display: 'flex', alignItems: 'center',
    gap: '10px', margin: '4px 0 0',
  },
  dividerLine: { flex: 1, height: '1px', background: '#e8e6e0' },
  dividerText: { fontSize: '12px', color: '#aaa' },
  switchText: {
    textAlign: 'center', fontSize: '13px',
    color: '#666', margin: 0,
  },
  link: {
    color: '#1a1a18', fontWeight: '600',
    textDecoration: 'none', borderBottom: '1px solid #1a1a18',
  },
};

export default Login;
