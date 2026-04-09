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
import DonationsPage from './pages/DonationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EditProfilePage from './pages/EditProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDonationsPage from './pages/AdminDonationsPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ComingSoonPage from './pages/ComingSoonPage';
import { CookieConsentProvider } from './context/CookieConsentContext';
import AssistantPage from './pages/AssistantPage';
import AdminChatPage from './pages/AdminChatPage';
import ChatPage from './components/chat/ChatPage';

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
  function ChatLauncher() {
    const { pathname } = useLocation();
    const { isAuthenticated, authSession } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    if (pathname === '/assistant' || pathname === '/admin/chat') {
      return null;
    }

    const adminMode = isAuthenticated && authSession.roles.includes('Admin');

    return (
      <>
        <button
          type="button"
          className="chat-launcher-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open assistant"
        >
          <MessageCircle size={16} />
          Assistant
        </button>
        {isOpen ? (
          <section className={`chat-popup-shell ${isExpanded ? 'expanded' : ''}`} aria-label="Assistant popup">
            <header className="chat-popup-header">
              <div>Assistant</div>
              <div className="chat-popup-header-actions">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  aria-label={isExpanded ? 'Downsize chat window' : 'Expand chat window'}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat popup">
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
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/coming-soon" element={<ComingSoonPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
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
                <Route
                  path="/admin/donations"
                  element={
                    <RequireAuth adminOnly>
                      <AdminDonationsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/chat"
                  element={
                    <RequireAuth adminOnly>
                      <AdminChatPage />
                    </RequireAuth>
                  }
                />
              </Routes>
            </main>
            <Footer />
            <ChatLauncher />
            <CookieConsentBanner />
          </div>
        </Router>
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;
