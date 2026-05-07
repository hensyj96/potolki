import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { AdminLayoutSkeleton } from './components/skeletons';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, authReady } = useAdmin();
  if (!authReady) return <AdminLayoutSkeleton />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
