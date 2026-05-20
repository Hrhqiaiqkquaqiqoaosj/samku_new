import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './layout/Layout';

const ProtectedRoute = ({ role }) => {
  const { currentUser, loading, isAuthenticated } = useAuth();

  // Debug protected route
  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    role, 
    userRole: currentUser?.role,
    loading
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  // Not authenticated -> redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  // Role check if specific role is required (case-insensitive comparison)
  if (role && currentUser?.role !== role.toLowerCase()) {
    console.log(`Role mismatch: Required ${role}, User has ${currentUser?.role}`);
    // Redirect to appropriate dashboard based on user role
    if (currentUser?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (currentUser?.role === 'host') {
      return <Navigate to="/host/dashboard" replace />;
    } else if (currentUser?.role === 'user') {
      return <Navigate to="/user/dashboard" replace />;
    }
  }

  // Authenticated and correct role -> render the outlet wrapped in the layout
  console.log('Authentication successful, rendering protected content');
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;