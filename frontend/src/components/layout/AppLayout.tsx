import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from '../common/ErrorBoundary';
import ProtectedRoute from '../common/ProtectedRoute';
import AppFooter from './AppFooter';
import { CreateFlowProvider } from '../../context/CreateFlowContext';

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <CreateFlowProvider>
          <Navbar />
          <main className="min-w-0 lg:pl-64">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
              <Outlet />
              <AppFooter />
            </div>
          </main>
        </CreateFlowProvider>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
