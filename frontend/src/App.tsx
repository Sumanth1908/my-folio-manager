import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Accounts from './pages/Accounts';
import AccountDetails from './pages/AccountDetails';
import AllTransactions from './pages/AllTransactions';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Portfolio from './pages/Portfolio';
import ErrorBoundary from './components/ErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
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
                <ErrorBoundary>
                  <>
                    <Navbar />
                    <Accounts />
                  </>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/accounts/:id" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <>
                    <Navbar />
                    <AccountDetails />
                  </>
                </ErrorBoundary>
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
                <ErrorBoundary>
                  <>
                    <Navbar />
                    <Settings />
                  </>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <>
                    <Navbar />
                    <Portfolio />
                  </>
                </ErrorBoundary>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
