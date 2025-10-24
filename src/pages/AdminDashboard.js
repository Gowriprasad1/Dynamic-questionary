import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Logout as LogoutIcon,
  AccountCircle,
  ManageAccounts as ManageAccountsIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './HomePage';
import UserManagement from './UserManagement';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isUsersPage = location.pathname === '/admin/users';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/admin')}
              variant={!isUsersPage ? 'outlined' : 'text'}
            >
              Forms
            </Button>
            <Button
              color="inherit"
              startIcon={<ManageAccountsIcon />}
              onClick={() => navigate('/admin/users')}
              variant={isUsersPage ? 'outlined' : 'text'}
            >
              Users
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {user.userId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Administrator
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/form/:id" element={<HomePage />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
