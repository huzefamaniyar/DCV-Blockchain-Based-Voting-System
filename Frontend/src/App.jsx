import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Component } from 'react';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Loader from './components/Loader';
import MainLayout from './components/MainLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Elections from './pages/Elections';
import Vote from './pages/Vote';
import Results from './pages/Results';
import Profile from './pages/Profile';
import Feedback from './pages/Feedback';
import AdminPanel from './pages/AdminPanel';
import CreateElection from './pages/CreateElection';
import UserManagement from './pages/UserManagement';

// Temporary placeholder component for missing pages
const ComingSoon = ({ pageName }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>🚧 {pageName} - Coming Soon</h1>
    <p>This page is under construction.</p>
    <p>Backend API is ready, frontend page will be created soon.</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppLayout = ({ children }) => (
  <MainLayout>
    {children}
  </MainLayout>
);

function AppInner() {
  // Extreme minimal bypass: render static content only
  const EXTREME_MINIMAL = false;
  if (EXTREME_MINIMAL) {
    return (
      <div style={{ padding: 16 }}>
        <h2>App Minimal Baseline</h2>
        <p>If this renders without errors, the issue is in routing/layout or a page component.</p>
      </div>
    );
  }

  const location = useLocation();
  const isHome = location.pathname === '/';
  const MIN_LAYOUT_BYPASS = false; // temporary: isolate layout issues

  return (
    <div>
      {MIN_LAYOUT_BYPASS ? (
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/register" />} />
        </Routes>
      ) : (
        <>
          {/* Fullpage Home without layout */}
          {isHome && (
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          )}

          {/* Everything else inside MainLayout */}
          {!isHome && (
            <AppLayout>
              <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/elections"
                    element={
                      <ProtectedRoute>
                        <Elections />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/election/:id"
                    element={
                      <ProtectedRoute>
                        <ComingSoon pageName="Election Details" />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/vote/:id"
                    element={
                      <ProtectedRoute>
                        <Vote />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/results/:id"
                    element={
                      <ProtectedRoute>
                        <Results />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute adminOnly>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/admin/create-election"
                    element={
                      <ProtectedRoute adminOnly>
                        <CreateElection />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute adminOnly>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/admin/verification"
                    element={
                      <ProtectedRoute adminOnly>
                        <ComingSoon pageName="Voter Verification" />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/feedback"
                    element={
                      <ProtectedRoute>
                        <Feedback />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AppLayout>
          )}
        </>
      )}
      {/* <ToastContainer /> */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <GlobalErrorBoundary>
          <AppInner />
        </GlobalErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[GlobalErrorBoundary] Caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: '#220000', color: '#fff', borderRadius: 8 }}>
          <h3>Render error</h3>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {String(this.state.error)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
