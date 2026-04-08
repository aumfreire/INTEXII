import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
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

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — own layout, no public Navbar/Footer */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPlaceholder title="Dashboard" subtitle="Overview of shelter operations and key metrics." />} />
          <Route path="caseload" element={<CaseloadPage />} />
          <Route path="residents" element={<AdminPlaceholder title="Residents" subtitle="Current and past residents of the shelter." />} />
          <Route path="residents/:id" element={<ResidentDetailPage />} />
          <Route path="donors" element={<AdminPlaceholder title="Donors" subtitle="View and manage donor information." />} />
          <Route path="contributions" element={<AdminPlaceholder title="Contributions" subtitle="Track donations and financial contributions." />} />
          <Route path="process-recordings" element={<AdminPlaceholder title="Process Recordings" subtitle="Document and review case interactions." />} />
          <Route path="home-visits" element={<AdminPlaceholder title="Home Visits" subtitle="Schedule and log home visit records." />} />
          <Route path="case-conferences" element={<AdminPlaceholder title="Case Conferences" subtitle="Plan and track multi-disciplinary meetings." />} />
          <Route path="reports" element={<AdminPlaceholder title="Reports" subtitle="Generate reports for stakeholders and compliance." />} />
          <Route path="settings" element={<AdminPlaceholder title="Settings" subtitle="Manage account and system preferences." />} />
        </Route>

        {/* Public routes — Navbar + Footer wrapper */}
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
                  <Route path="/signup" element={<SignUpPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
