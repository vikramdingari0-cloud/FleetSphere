import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtext,
  trend,
  trendType = 'positive',
  color = 'primary',
  onClick = null
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`stat-card ${isClickable ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease'
      }}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="stat-header">
        <span className="stat-label">{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isClickable && (
            <span style={{ color: 'var(--text-dim)', transition: 'color 0.15s ease' }} className="stat-hover-icon">
              <ArrowUpRight size={14} />
            </span>
          )}
          {Icon && (
            <div
              className="stat-icon-wrapper"
              style={{
                color: color === 'success' ? '#10b981' : color === 'warning' ? '#f59e0b' : color === 'danger' ? '#ef4444' : color === 'purple' ? '#8b5cf6' : '#0ea5e9',
                backgroundColor: color === 'success' ? 'rgba(16,185,129,0.12)' : color === 'warning' ? 'rgba(245,158,11,0.12)' : color === 'danger' ? 'rgba(239,68,68,0.12)' : color === 'purple' ? 'rgba(139,92,246,0.12)' : 'rgba(14,165,233,0.12)'
              }}
            >
              <Icon size={18} />
            </div>
          )}
        </div>
      </div>

      <div className="stat-value">{value}</div>

      {(subtext || trend) && (
        <div className="stat-footer">
          {trend && (
            <span
              style={{
                color: trendType === 'positive' ? '#34d399' : trendType === 'negative' ? '#f87171' : 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              {trend}
            </span>
          )}
          {subtext && <span style={{ color: 'var(--text-dim)' }}>{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
