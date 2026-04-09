import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { Maximize2, MessageCircle, Minimize2, X } from 'lucide-react';
import './App.css';
import AssistantPage from './pages/AssistantPage';
import AdminChatPage from './pages/AdminChatPage';
import ChatPage from './components/chat/ChatPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import DonationPage from './pages/DonationPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CaseloadPage from './pages/CaseloadPage';
import ResidentDetailPage from './pages/ResidentDetailPage';
import AdminSafehousesPage from './pages/AdminSafehousesPage';
import DonorsPage from './pages/DonorsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminInsightsPage from './pages/AdminInsightsPage';
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
import ProcessRecordingsPage from './pages/ProcessRecordingsPage';
import HomeVisitsPage from './pages/HomeVisitsPage';
import ReportsPage from './pages/ReportsPage';
import PartnersPage from './pages/PartnersPage';
import ImpactPage from './pages/ImpactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import IncidentReportsPage from './pages/IncidentReportsPage';

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

function ChatLauncher() {
  const { pathname } = useLocation();
  const { isAuthenticated, authSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (pathname === '/chat' || pathname.startsWith('/admin')) {
    return null;
  }

  const adminMode = isAuthenticated && authSession.roles.includes('Admin');

  return (
    <>
      <button
        type="button"
        className="chat-launcher-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        Chat
        <MessageCircle size={16} />
      </button>
      {isOpen ? (
        <section className={`chat-popup-shell ${isExpanded ? 'expanded' : ''}`} aria-label="Chat popup">
          <header className="chat-popup-header">
            <div>Chat</div>
            <div className="chat-popup-header-actions">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-label={isExpanded ? 'Smaller chat window' : 'Larger chat window'}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">
                <X size={15} />
              </button>
            </div>
          </header>
          <div className="chat-popup-body">
            <ChatPage adminMode={adminMode} popupMode showFullscreenToggle={false} />
          </div>
        </section>
      ) : null}
    </>
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
              <Route path="safehouses" element={<AdminSafehousesPage />} />
              <Route path="residents/:id" element={<ResidentDetailPage />} />
              <Route path="donors" element={<DonorsPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="contributions" element={<AdminDonationsPage />} />
              <Route path="process-recordings" element={<ProcessRecordingsPage />} />
              <Route path="home-visits" element={<HomeVisitsPage />} />
              <Route path="incidents" element={<IncidentReportsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="insights" element={<AdminInsightsPage />} />
              <Route path="chat" element={<AdminChatPage />} />
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
                      <Route path="/impact" element={<ImpactPage />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/auth/callback" element={<AuthCallbackPage />} />
                      <Route path="/cookies" element={<CookiePolicyPage />} />
                      <Route path="/coming-soon" element={<ComingSoonPage />} />
                      <Route path="/chat" element={<AssistantPage />} />
                      <Route path="/assistant" element={<Navigate to="/chat" replace />} />
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
                  <ChatLauncher />
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
