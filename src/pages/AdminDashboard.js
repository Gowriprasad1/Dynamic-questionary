import React, { useState } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import '../ui/insta/_form.scss';
import HomePage from './HomePage';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMenu = () => setMenuOpen(v => !v);

  const isUsersPage = location.pathname === '/admin/users';
  const isCategoriesPage = location.pathname === '/admin/categories';

  return (
    <div className="insta-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--insta-primary)', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Admin Dashboard</div>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="insta-proceed" style={{ background: 'transparent', border: '1px solid #fff', color: '#fff' }} onClick={() => navigate('/admin')}>Forms</button>
            <button className="insta-proceed" style={{ background: isCategoriesPage ? '#fff' : 'transparent', color: isCategoriesPage ? 'var(--insta-primary)' : '#fff', border: '1px solid #fff' }} onClick={() => navigate('/admin/categories')}>Categories</button>
            <button className="insta-proceed" style={{ background: isUsersPage ? '#fff' : 'transparent', color: isUsersPage ? 'var(--insta-primary)' : '#fff', border: '1px solid #fff' }} onClick={() => navigate('/admin/users')}>Users</button>
            <div style={{ position: 'relative' }}>
              <button className="insta-proceed" style={{ background: 'transparent', border: '1px solid #fff', color: '#fff' }} onClick={toggleMenu} aria-expanded={menuOpen} aria-haspopup="true">
                {user.userId || 'Account'}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', color: '#333', border: '1px solid var(--insta-border)', borderRadius: 6, minWidth: 200, padding: 8, zIndex: 10 }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--insta-border)', fontWeight: 600 }}>{user.userId}</div>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '10px', cursor: 'pointer', color: 'var(--insta-primary)' }}>Logout</button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/form/:id" element={<HomePage />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </main>
    </div>
  );
}

export default AdminDashboard;
