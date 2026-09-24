import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Universal Contextual Detail Drawer
 * Allows users to inspect any fleet entity in detail without leaving their current view or losing table context.
 */
const DetailDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  badgeType = 'info',
  sections = [],
  children,
  footerActions
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h2>
              {badge && (
                <span className={`status-badge status-${badgeType.toLowerCase().replace(/\s+/g, '-')}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="drawer-section">
              {section.title && <div className="drawer-section-title">{section.title}</div>}
              <div className="drawer-grid">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx}>
                    <div className="drawer-prop-label">{item.label}</div>
                    <div className="drawer-prop-val">{item.value ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {children}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          {footerActions || (
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              Close Detail View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailDrawer;
