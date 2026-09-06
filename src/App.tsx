import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DrawerLayout from './components/layout/DrawerLayout';
import LoginPage from './components/pages/LoginPage';
import UserMaster from './components/master/UserMaster';
import KarigarMaster from './components/master/KarigarMaster';
import ServiceMaster from './components/master/ServiceMaster';
import NotificationMaster from './components/master/NotificationMaster';
import BlockedUsersMaster from './components/master/BlockedUsersMaster';
import HeatMap from './components/master/HeatMap';
import Reports from './components/master/Reports';
import { CircularProgress, Box } from '@mui/material';

// A simple protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const location = useLocation();

  useEffect(() => {
    // Simulate loading time for auth check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login with return url
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
// Public route that redirects to dashboard if already authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const location = useLocation();
  const from = location.state?.from?.pathname || '/users';

  return isAuthenticated ? (
    <Navigate to={from} replace />
  ) : (
    <>{children}</>
  );
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DrawerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/users" replace />} />
        <Route path="users" element={<UserMaster />} />
        <Route path="karigars" element={<KarigarMaster />} />
        <Route path="services" element={<ServiceMaster />} />
        <Route path="notifications" element={<NotificationMaster />} />
        <Route path="blocked-users" element={<BlockedUsersMaster />} />
        <Route path="heatmap" element={<HeatMap />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
