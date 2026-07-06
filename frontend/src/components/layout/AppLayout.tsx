import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from '../common/ErrorBoundary';
import ProtectedRoute from '../common/ProtectedRoute';

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
