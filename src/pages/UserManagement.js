import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ui/insta/_form.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleAddUser = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/auth/users`,
        { userId: newUserId, password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`User "${newUserId}" created successfully!`);
      setNewUserId('');
      setNewPassword('');
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete user "${userId}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`User "${userId}" deleted successfully!`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="insta-page" style={{ paddingTop: 16 }}>
      <div className="insta-card" style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>User Management</div>
            <div style={{ color: 'var(--insta-muted)' }}>Manage admin users who can access the form builder</div>
          </div>
          <button className="insta-button" onClick={() => setOpenDialog(true)}>Add New User</button>
        </div>

        {error && (
          <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }} onClick={() => setError('')}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginBottom: 12, color: 'green', background: '#eaf9ea', padding: 12, borderRadius: 8 }} onClick={() => setSuccess('')}>
            {success}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7f7f8' }}>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>User ID</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>Created By</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>Created At</th>
                <th style={{ textAlign: 'right', padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 50, background: 'var(--insta-primary)' }} />
                      {user.userId}
                      {user.userId === currentUser.userId && (
                        <span style={{ marginLeft: 6, border: '1px solid var(--insta-primary)', color: 'var(--insta-primary)', padding: '2px 6px', borderRadius: 10, fontSize: 12 }}>You</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>{user.createdBy}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--insta-border)' }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--insta-border)', textAlign: 'right' }}>
                    <button
                      className="insta-button"
                      style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }}
                      onClick={() => handleDeleteUser(user.userId)}
                      disabled={user.userId === currentUser.userId}
                      title={user.userId === currentUser.userId ? 'You cannot delete your own account' : 'Delete user'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--insta-muted)' }}>No users found</div>
        )}
      </div>

      {openDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="insta-card" style={{ width: '90%', maxWidth: 480, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Add New User</div>
            <div style={{ marginTop: 8 }}>
              <div className="ui-input-wrapper">
                <label className="ui-input-label">User ID *</label>
                <input
                  className="ui-input"
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="Enter a unique user ID (lowercase)"
                  required
                />
              </div>
              <div className="ui-input-wrapper">
                <label className="ui-input-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="ui-input"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    required
                    style={{ paddingRight: 80 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 8, top: 8, background: 'transparent', border: '1px solid var(--insta-border)', borderRadius: 14, padding: '4px 8px', cursor: 'pointer', color: 'var(--insta-muted)' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={() => setOpenDialog(false)}>Cancel</button>
              <button className="insta-button" onClick={handleAddUser} disabled={!newUserId || !newPassword || loading}>
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
