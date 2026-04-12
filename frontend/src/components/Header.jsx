import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, LogOut, Check, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Header() {
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { logout, user } = useAuth();
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
          <Search size={15} className="text-slate-400 flex-shrink-0" />
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
              <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                  {hasUnread && (
                    <button 
                      onClick={markAllRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`px-4 py-3 border-b border-slate-50 flex gap-3 hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="mt-0.5">
                          {notif.notification_type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                          {notif.notification_type === 'warning' && <AlertTriangle size={16} className="text-orange-500" />}
                          {notif.notification_type === 'info' && <Info size={16} className="text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${!notif.is_read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                            {notif.content}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => markRead(e, notif.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200" />

          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
            id="new-project-header-btn"
          >
            <Plus size={16} />
            New Project
          </button>
          
          <div className="flex items-center gap-2 ml-2 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200">
            <span className="text-sm font-semibold text-slate-700">{displayUser}</span>
            <button 
              onClick={logout} 
              className="text-slate-500 hover:text-red-500 transition-colors bg-white p-1 rounded-full shadow-sm"
              title="Logout"
            >
              <LogOut size={14} />
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
