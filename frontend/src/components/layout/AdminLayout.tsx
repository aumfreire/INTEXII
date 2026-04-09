import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Home,
  Heart,
  DollarSign,
  FileText,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import Navbar from './Navbar';
import '../../styles/pages/admin-layout.css';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/caseload', icon: ClipboardList, label: 'Caseload' },
  { to: '/admin/residents', icon: Users, label: 'Residents' },
  { to: '/admin/donors', icon: Heart, label: 'Donors' },
  { to: '/admin/contributions', icon: DollarSign, label: 'Contributions' },
  { divider: true },
  { to: '/admin/process-recordings', icon: FileText, label: 'Process Recordings' },
  { to: '/admin/home-visits', icon: Home, label: 'Home Visits' },
  { to: '/admin/case-conferences', icon: Calendar, label: 'Case Conferences' },
  { divider: true },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
] as const;

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'U';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { authSession } = useAuth();

  const displayName = authSession.displayName
    ?? authSession.userName
    ?? authSession.email
    ?? 'User';

  const role = authSession.roles.length > 0
    ? authSession.roles.join(', ')
    : 'Staff';

  const initials = getInitials(displayName);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <Navbar />

      <div className="admin-shell">
        {/* Mobile overlay */}
        <div
          className={`admin-mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={closeSidebar}
        />

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>

          <ul className="admin-nav">
            {navItems.map((item, i) => {
              if ('divider' in item) {
                return <li key={`div-${i}`} className="admin-nav-divider" />;
              }

              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    className={({ isActive }) =>
                      `admin-nav-item ${isActive ? 'active' : ''}`
                    }
                    onClick={closeSidebar}
                  >
                    <Icon size={18} className="admin-nav-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user">
              <div className="admin-sidebar-avatar">{initials}</div>
              <div className="admin-sidebar-user-info">
                <span className="admin-sidebar-user-name">{displayName}</span>
                <span className="admin-sidebar-user-role">{role}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="admin-main">

          {/* Mobile header */}
          <header className="admin-mobile-header">
            <Link to="/admin" className="admin-mobile-logo" onClick={closeSidebar}>
              <Shield
                size={22}
                style={{ color: 'var(--color-primary)' }}
                fill="var(--color-primary)"
              />
              <span className="admin-mobile-logo-text">Haven</span>
            </Link>
            <div className="admin-mobile-actions">
              <div
                className="admin-topbar-avatar"
                title={displayName}
                style={{ width: '30px', height: '30px', fontSize: '0.7rem' }}
              >
                {initials}
              </div>
              <button
                className="admin-mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </header>

          {/* Page content — child routes render here */}
          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
