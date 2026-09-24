import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { LogOut, Building2, Search, Sun, Moon } from 'lucide-react';

const Navbar = ({ onOpenCommandPalette }) => {
  const { user, logout, demoLogin } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('fleetsphere_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fleetsphere_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="telemetry-live" />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>
            TELEMETRY ONLINE
          </span>
        </div>

        {user?.branch && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.03)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Building2 size={13} color="#0ea5e9" />
            <span>{user.branch.name || 'Assigned Branch'}</span>
          </div>
        )}

        {/* Global Command Palette Trigger Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="btn btn-secondary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-dim)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
          title="Open Command Center (Ctrl+K)"
        >
          <Search size={14} color="var(--primary)" />
          <span style={{ fontSize: '12.5px' }}>Command Palette...</span>
          <kbd className="cmd-kbd" style={{ fontSize: '10px', padding: '1px 5px' }}>Ctrl K</kbd>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          style={{ width: '32px', height: '32px' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
        </button>

        {/* Fast Demo Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Role:
          </span>
          <select
            value={user?.role || ''}
            onChange={(e) => demoLogin(e.target.value)}
            className="form-select"
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              height: '32px',
              width: '155px',
              background: 'rgba(14, 165, 233, 0.08)',
              borderColor: 'rgba(14, 165, 233, 0.3)',
              color: '#38bdf8',
              fontWeight: 600
            }}
          >
            {DEMO_USERS.map((u) => (
              <option key={u.role} value={u.role} style={{ background: '#0f172a', color: '#fff' }}>
                {u.role}
              </option>
            ))}
          </select>
        </div>

        {/* User Profile Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingLeft: '12px',
            borderLeft: '1px solid var(--border-subtle)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>{user?.name}</span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{user?.role}</span>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="btn btn-secondary btn-icon"
            style={{ width: '30px', height: '30px', marginLeft: '4px' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
