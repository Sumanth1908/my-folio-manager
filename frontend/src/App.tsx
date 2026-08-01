import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { lazy, Suspense } from 'react';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import Assistant from './pages/Assistant';

const Accounts = lazy(() => import('./pages/Accounts'));
const AccountDetails = lazy(() => import('./pages/AccountDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Activity = lazy(() => import('./pages/Activity'));
const Rules = lazy(() => import('./pages/Rules'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="isolate min-h-screen bg-background text-foreground">
          <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" /></div>}>
            <Routes>
              {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes inside AppLayout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/:id" element={<AccountDetails />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/automations" element={<Rules />} />
              <Route path="/transactions" element={<Navigate to="/activity" replace />} />
              <Route path="/rules" element={<Navigate to="/automations" replace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wealth" element={<Portfolio />} />
              <Route path="/portfolio" element={<Navigate to="/wealth" replace />} />
              <Route path="/planning" element={<Budgets />} />
              <Route path="/budgets" element={<Navigate to="/planning" replace />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            </Routes>
          </Suspense>
        </div>
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </Router>
  );
}

export default App;
