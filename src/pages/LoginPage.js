import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../ui/insta/_form.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        userId,
        password
      });

      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="insta-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
      <div className="insta-card" style={{ width: '100%', maxWidth: 520, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--insta-primary)', marginBottom: 6 }}>Admin Login</div>
          <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>Sign in to access the form builder</div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ui-input-wrapper">
            <label className="ui-input-label">User ID *</label>
            <input
              className="ui-input"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              required
              autoFocus
              style={{ boxSizing: 'border-box', width: '100%' }}
            />
          </div>

          <div className="ui-input-wrapper">
            <label className="ui-input-label">Password *</label>
            <div style={{ position: 'relative', maxWidth: '100%', overflow: 'hidden' }}>
              <input
                className="ui-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 88, boxSizing: 'border-box', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: '#f5f9ff', border: '1px solid var(--insta-border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: 'var(--insta-primary)', height: 28, lineHeight: '20px' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="insta-button"
            disabled={loading}
            style={{ width: '100%', marginTop: 12 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 12, padding: 12, background: '#f7f7f8', borderRadius: 8, color: 'var(--insta-muted)', fontSize: 12 }}>
          <strong>Note:</strong> Only authorized administrators can access the form builder.
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
