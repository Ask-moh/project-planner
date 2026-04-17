import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, LogOut, Check, CheckCircle2, Info, AlertTriangle, Moon, Sun } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { logout, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Refresh notifications every 30 seconds
    intervalRef.current = setInterval(loadNotifications, 30000);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [loadNotifications]);

  const hasUnread = notifications.some(n => !n.is_read);

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const markRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  // Display user info
  const displayUser = user?.email || user || 'User';

  return (
    <>
      <header className="header">
        {/* Search */}
        <div className="search-bar">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="global-search"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button 
            className="icon-btn" 
            aria-label="Toggle Theme" 
            onClick={toggleTheme}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button 
              className="icon-btn" 
              aria-label="Notifications" 
              id="notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
              {hasUnread && <span className="notification-dot" />}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h3>
                  {hasUnread && (
                    <button 
                      onClick={markAllRead}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${!notif.is_read ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}
                      >
                        <div className="mt-0.5">
                          {notif.notification_type === 'success' && <CheckCircle2 size={16} className="text-emerald-500" />}
                          {notif.notification_type === 'warning' && <AlertTriangle size={16} className="text-orange-500" />}
                          {notif.notification_type === 'info' && <Info size={16} className="text-primary-500" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                            {notif.content}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1 block">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => markRead(e, notif.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} strokeWidth={2.5}/>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
            id="new-project-header-btn"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Project</span>
          </button>
          
          <div className="flex items-center gap-3 ml-2 bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{displayUser}</span>
            <button 
              onClick={logout} 
              className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors bg-white dark:bg-slate-700 p-1.5 rounded-lg shadow-sm hover:shadow"
              title="Logout"
            >
              <LogOut size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {showModal && (
        <Modal
          type="project"
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            window.dispatchEvent(new Event('project-created'));
          }}
        />
      )}
    </>
  );
}
