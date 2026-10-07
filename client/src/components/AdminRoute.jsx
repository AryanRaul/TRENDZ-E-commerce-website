import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <main className="route-loading">Checking access…</main>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (user?.role !== 'admin') return <main className="forbidden-page"><p className="eyebrow">ACCESS RESTRICTED</p><h1>This page is for administrators.</h1><p>Your account does not have permission to manage products.</p><Navigate to="/account" replace /></main>;
  return children;
}
