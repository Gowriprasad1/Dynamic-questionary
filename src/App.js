import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserForm from './pages/UserForm';
import CategoryEntry from './pages/CategoryEntry';
import ReviewPage from './pages/ReviewPage';
import SubmittedSuccess from './pages/SubmittedSuccess';
import { Provider } from 'react-redux';
import store from './store';
import ProtectedRoute from './components/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Provider store={store}>
      <Router>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Login page */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Public user form routes - dynamic category route */}
          <Route path="/:category" element={<CategoryEntry />} />
          <Route path="/:category/form" element={<UserForm />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/submitted" element={<SubmittedSuccess />} />
        </Routes>
      </Router>
      </Provider>
    </ThemeProvider>
  );
}

export default App;