import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Accounts from './pages/Accounts';
import AccountDetails from './pages/AccountDetails';
import AllTransactions from './pages/AllTransactions';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <>
                      <Navbar />
                      <Dashboard />
                    </>
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/accounts" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Accounts />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/accounts/:id" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <AccountDetails />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <>
                      <Navbar />
                      <AllTransactions />
                    </>
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Settings />
                  </>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
