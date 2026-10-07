import React, { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../../services/api';
import {
  Bell,
  AlertTriangle,
  Clock,
  Wrench,
  DollarSign,
  FileText,
  Shield,
  CheckCheck,
  ChevronRight,
  ExternalLink,
  Radio
} from 'lucide-react';

const NotificationDropdown = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('fleetsphere_read_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getAll();
      const list = res.data?.notifications || [];
      setNotifications(list);
      // Unread count minus user marked reads
      const activeUnread = list.filter(n => !readIds.includes(n.id)).length;
      setUnreadCount(activeUnread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Periodic refresh every 45s
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    setUnreadCount(0);
    localStorage.setItem('fleetsphere_read_notifs', JSON.stringify(allIds));
  };

  const handleNotificationClick = (item) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      setUnreadCount(prev => Math.max(0, prev - 1));
      localStorage.setItem('fleetsphere_read_notifs', JSON.stringify(updated));
    }

    if (onNavigateTab && item.targetTab) {
      onNavigateTab(item.targetTab);
      setIsOpen(false);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeCategory === 'ALL') return true;
    return n.category === activeCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Critical': return <AlertTriangle size={14} color="#ef4444" />;
      case 'Operational': return <Radio size={14} color="#0ea5e9" />;
      case 'Maintenance': return <Wrench size={14} color="#f59e0b" />;
      case 'Finance': return <DollarSign size={14} color="#10b981" />;
      case 'Documents': return <FileText size={14} color="#8b5cf6" />;
      default: return <Shield size={14} color="#38bdf8" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="btn btn-secondary btn-icon"
        style={{ position: 'relative', width: '34px', height: '34px' }}
        title="Fleet Telematics Notifications"
        aria-label="Open notifications center"
      >
        <Bell size={16} color={unreadCount > 0 ? '#38bdf8' : 'var(--text-dim)'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: '0',
            width: '380px',
            backgroundColor: '#0c1220',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-float)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#090e18'
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff' }}>
                Operational Notification Center
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {unreadCount} active event{unreadCount !== 1 ? 's' : ''} requiring attention
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCheck size={13} /> Mark Read
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              overflowX: 'auto',
              background: 'rgba(255,255,255,0.02)'
            }}
          >
            {['ALL', 'Critical', 'Operational', 'Maintenance', 'Finance', 'Documents'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  border: 'none',
                  background: activeCategory === cat ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                  color: activeCategory === cat ? '#38bdf8' : 'var(--text-dim)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12.5px' }}>
                All clear! No active notifications in {activeCategory}.
              </div>
            ) : (
              filteredNotifs.map((item) => {
                const isRead = readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isRead ? 'transparent' : 'rgba(14, 165, 233, 0.04)',
                      transition: 'background 0.15s ease',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isRead ? 'transparent' : 'rgba(14, 165, 233, 0.04)'}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {getCategoryIcon(item.category)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: isRead ? 'var(--text-muted)' : '#fff' }}>
                          {item.title}
                        </span>
                        {!isRead && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9' }} />
                        )}
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {item.message}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {item.category}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', color: '#38bdf8', fontWeight: 600 }}>
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
