import React from 'react';

const StatCard = ({ icon: Icon, title, value, subtext, trend, trendType = 'positive', color = 'primary' }) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{title}</span>
        {Icon && (
          <div className="stat-icon-wrapper" style={{
            color: color === 'success' ? '#10b981' : color === 'warning' ? '#f59e0b' : color === 'danger' ? '#ef4444' : color === 'purple' ? '#8b5cf6' : '#0ea5e9',
            backgroundColor: color === 'success' ? 'rgba(16,185,129,0.12)' : color === 'warning' ? 'rgba(245,158,11,0.12)' : color === 'danger' ? 'rgba(239,68,68,0.12)' : color === 'purple' ? 'rgba(139,92,246,0.12)' : 'rgba(14,165,233,0.12)'
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-value">{value}</div>

      {(subtext || trend) && (
        <div className="stat-footer">
          {trend && (
            <span
              style={{
                color: trendType === 'positive' ? '#34d399' : '#f87171',
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
