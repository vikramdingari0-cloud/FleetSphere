import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole } from '../../config/navigationConfig';
import { Radio } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const navItems = getNavigationForRole(user?.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)'
          }}
        >
          <Radio size={20} />
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            FLEET<span style={{ color: '#0ea5e9' }}>SPHERE</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Enterprise Telematics
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                border: 'none',
                textAlign: 'left',
                background: isActive ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div className="nav-item-content">
                <Icon size={18} color={isActive ? '#38bdf8' : 'var(--text-dim)'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="badge badge-subtle" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footnote */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Role View:</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{user?.role || 'Guest'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Telematics Link:</span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>Active (Secure)</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
