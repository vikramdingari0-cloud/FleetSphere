import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsAPI } from '../services/api';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import FleetManagerDashboard from './dashboards/FleetManagerDashboard';
import BranchManagerDashboard from './dashboards/BranchManagerDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import FinanceOfficerDashboard from './dashboards/FinanceOfficerDashboard';
import { RefreshCw } from 'lucide-react';

const DashboardPage = ({ setActiveTab }) => {
  const { user, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast && showToast('Telemetry stream update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.role, user?.branch]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <RefreshCw className="telemetry-live" size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Streaming telematics for {user?.role || 'User'}...
          </span>
        </div>
      </div>
    );
  }

  // Render role-specific personalized dashboard
  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'Super Admin':
        return (
          <SuperAdminDashboard
            data={data}
            user={user}
            setActiveTab={setActiveTab}
            onRefresh={fetchAnalytics}
            showToast={showToast}
          />
        );

      case 'Fleet Manager':
        return (
          <FleetManagerDashboard
            data={data}
            user={user}
            setActiveTab={setActiveTab}
            onRefresh={fetchAnalytics}
            showToast={showToast}
          />
        );

      case 'Branch Manager':
        return (
          <BranchManagerDashboard
            data={data}
            user={user}
            setActiveTab={setActiveTab}
            onRefresh={fetchAnalytics}
            showToast={showToast}
          />
        );

      case 'Driver':
        return (
          <DriverDashboard
            data={data}
            user={user}
            setActiveTab={setActiveTab}
            onRefresh={fetchAnalytics}
            showToast={showToast}
          />
        );

      case 'Finance Officer':
        return (
          <FinanceOfficerDashboard
            data={data}
            user={user}
            setActiveTab={setActiveTab}
            onRefresh={fetchAnalytics}
            showToast={showToast}
          />
        );

      default:
        return (
          <FleetManagerDashboard
            data={data}
            user={user}
            setActiveTab={setActiveTab}
            onRefresh={fetchAnalytics}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div>
      {renderDashboardByRole()}
    </div>
  );
};

export default DashboardPage;
