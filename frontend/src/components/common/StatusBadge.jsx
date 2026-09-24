import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase().replace(/[\s_&]/g, '');

  let badgeClass = 'badge-available';

  if (['available', 'completed', 'approved', 'valid', 'resolved'].includes(normalized)) {
    badgeClass = 'badge-available';
  } else if (['intransit', 'started'].includes(normalized)) {
    badgeClass = 'badge-intransit';
  } else if (['maintenance', 'delayed', 'pending', 'expiringsoon', 'medium', 'underinvestigation'].includes(normalized)) {
    badgeClass = 'badge-maintenance';
  } else if (['outofservice', 'cancelled', 'rejected', 'expired', 'critical', 'high', 'suspended'].includes(normalized)) {
    badgeClass = 'badge-outofservice';
  } else if (['planned', 'assigned', 'onduty', 'scheduled', 'low', 'offduty'].includes(normalized)) {
    badgeClass = 'badge-planned';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
};

export default StatusBadge;
