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
  LogOut,
} from 'lucide-react';
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

// Placeholder user — replace with real auth context later
const currentUser = {
  name: 'Maria Johnson',
  role: 'Case Manager',
  initials: 'MJ',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div
        className={`admin-mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-logo" onClick={closeSidebar}>
            <Shield
              size={24}
              style={{ color: 'var(--color-primary)' }}
              fill="var(--color-primary)"
            />
            <span className="admin-sidebar-logo-text">Haven</span>
          </Link>
          <span className="admin-sidebar-badge">Staff</span>
        </div>

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
            <div className="admin-sidebar-avatar">{currentUser.initials}</div>
            <div className="admin-sidebar-user-info">
              <span className="admin-sidebar-user-name">{currentUser.name}</span>
              <span className="admin-sidebar-user-role">{currentUser.role}</span>
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
              title={currentUser.name}
              style={{ width: '30px', height: '30px', fontSize: '0.7rem' }}
            >
              {currentUser.initials}
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

        {/* Desktop top bar */}
        <div className="admin-topbar">
          <div className="admin-topbar-user">
            <div style={{ textAlign: 'right' }}>
              <div className="admin-topbar-name">{currentUser.name}</div>
              <div className="admin-topbar-role">{currentUser.role}</div>
            </div>
            <div className="admin-topbar-avatar">{currentUser.initials}</div>
          </div>
        </div>

        {/* Page content — child routes render here */}
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
