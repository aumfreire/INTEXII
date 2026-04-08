import { useEffect } from 'react';
import type { ReactElement } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import './App.css';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import DonationPage from './pages/DonationPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LogoutPage from './pages/LogoutPage';
import ManageMfaPage from './pages/ManageMfaPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EditProfilePage from './pages/EditProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import CookiePolicyPage from './pages/CookiePolicyPage';
import { CookieConsentProvider } from './context/CookieConsentContext';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname, hash]);

  return null;
}

function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: ReactElement;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, authSession } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '48px 24px' }}>Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !authSession.roles.includes('Admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="page-wrapper">
            <Navbar />
            <main className="page-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/donate" element={<DonationPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/register" element={<SignUpPage />} />
                <Route path="/logout" element={<LogoutPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <DashboardPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <EditProfilePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/mfa"
                  element={
                    <RequireAuth>
                      <ManageMfaPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth adminOnly>
                      <AdminDashboardPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RequireAuth adminOnly>
                      <AdminUsersPage />
                    </RequireAuth>
                  }
                />
              </Routes>
            </main>
            <Footer />
            <CookieConsentBanner />
          </div>
        </Router>
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;
