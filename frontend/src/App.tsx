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
import AdminLayout from './components/layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import DonationPage from './pages/DonationPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CaseloadPage from './pages/CaseloadPage';
import ResidentDetailPage from './pages/ResidentDetailPage';
import DonorsPage from './pages/DonorsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LogoutPage from './pages/LogoutPage';
import ManageMfaPage from './pages/ManageMfaPage';
import DashboardPage from './pages/DashboardPage';
import DonationsPage from './pages/DonationsPage';
import EditProfilePage from './pages/EditProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDonationsPage from './pages/AdminDonationsPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ComingSoonPage from './pages/ComingSoonPage';
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

/* Placeholder for admin child pages — replace with real pages later */
function AdminPlaceholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">{title}</h1>
        <p className="admin-page-subtitle">{subtitle}</p>
      </div>
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-md)',
          padding: '48px 32px',
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          color: 'var(--color-muted)',
          fontSize: '0.95rem',
        }}
      >
        This page is coming soon.
      </div>
    </div>
  );
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
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAuth adminOnly>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="donations" element={<AdminDonationsPage />} />
              <Route path="caseload" element={<CaseloadPage />} />
              <Route
                path="residents"
                element={
                  <AdminPlaceholder
                    title="Residents"
                    subtitle="Current and past residents of the shelter."
                  />
                }
              />
              <Route path="residents/:id" element={<ResidentDetailPage />} />
              <Route path="donors" element={<DonorsPage />} />
              <Route path="contributions" element={<AdminDonationsPage />} />
              <Route
                path="process-recordings"
                element={
                  <AdminPlaceholder
                    title="Process Recordings"
                    subtitle="Document and review case interactions."
                  />
                }
              />
              <Route
                path="home-visits"
                element={
                  <AdminPlaceholder
                    title="Home Visits"
                    subtitle="Schedule and log home visit records."
                  />
                }
              />
              <Route
                path="case-conferences"
                element={
                  <AdminPlaceholder
                    title="Case Conferences"
                    subtitle="Plan and track multi-disciplinary meetings."
                  />
                }
              />
              <Route
                path="reports"
                element={
                  <AdminPlaceholder
                    title="Reports"
                    subtitle="Generate reports for stakeholders and compliance."
                  />
                }
              />
              <Route
                path="settings"
                element={
                  <AdminPlaceholder
                    title="Settings"
                    subtitle="Manage account and system preferences."
                  />
                }
              />
            </Route>

            <Route
              path="*"
              element={
                <div className="page-wrapper">
                  <Navbar />
                  <main className="page-content">
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/donate" element={<DonationPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/cookies" element={<CookiePolicyPage />} />
                      <Route path="/coming-soon" element={<ComingSoonPage />} />
                      <Route path="/signup" element={<SignUpPage />} />
                      <Route path="/register" element={<SignUpPage />} />
                      <Route path="/logout" element={<LogoutPage />} />
                      <Route
                        path="/donations"
                        element={
                          <RequireAuth>
                            <DonationsPage />
                          </RequireAuth>
                        }
                      />
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
                    </Routes>
                  </main>
                  <Footer />
                  <CookieConsentBanner />
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;
