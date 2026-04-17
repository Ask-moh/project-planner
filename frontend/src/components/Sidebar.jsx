import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, GanttChartSquare,
  BarChart2, Sparkles, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/gantt', icon: GanttChartSquare, label: 'Gantt Chart' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/ai-planner', icon: Sparkles, label: 'AI Planner' },
  { to: '/team', icon: Users, label: 'Team' },
];

export default function Sidebar() {
  // Use the authenticated user info instead of fetching first user from API
  const { user } = useAuth();

  const displayName = user?.email || user || 'User';
  const initials = typeof displayName === 'string'
    ? displayName.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">ProjectPlanner</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Menu</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">Active</p>
        </div>
      </div>
    </aside>
  );
}
