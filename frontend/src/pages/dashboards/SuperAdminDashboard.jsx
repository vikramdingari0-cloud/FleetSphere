import React from 'react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Shield,
  Building2,
  Truck,
  Users,
  Navigation,
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const SuperAdminDashboard = ({ data, setActiveTab, onRefresh }) => {
  const s = data?.summary || {};
  const charts = data?.charts || {};
  const recentLogs = data?.recentActivity || [];
  const superAdmin = data?.roleContext?.superAdmin || {};
  const branches = superAdmin.branchesOverview || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Platform Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="role-badge super-admin">
              <Shield size={13} /> Global Command Center
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Multi-Branch Architecture &bull; Uptime: {superAdmin.systemUptime || '99.98%'}
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            Enterprise Telematics &amp; Infrastructure
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveTab('vehicles')} className="btn btn-primary btn-sm">
            <Plus size={14} /> Onboard Fleet Asset
          </button>
        </div>
      </div>

      {/* Global Executive Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <StatCard
          icon={Building2}
          title="Active Hub Branches"
          value={branches.length || 3}
          subtext="Dallas, Chicago, Atlanta"
          trend="Operational"
          trendType="positive"
          color="purple"
        />
        <StatCard
          icon={Truck}
          title="Global Fleet Size"
          value={s.totalVehicles || 0}
          subtext={`${s.availableVehicles || 0} Available | ${s.inTransitVehicles || 0} In Transit`}
          trend={`${s.fleetHealthRate || 100}% Ready`}
          trendType="positive"
          color="primary"
        />
        <StatCard
          icon={Navigation}
          title="Platform Active Trips"
          value={s.activeTrips || 0}
          subtext={`${s.completedTrips || 0} completed historical`}
          trend={`${((s.totalCompletedDistanceKm || 0) / 1000).toFixed(1)}k km logged`}
          trendType="neutral"
          color="success"
        />
        <StatCard
          icon={AlertTriangle}
          title="Platform Alerts"
          value={(s.criticalMaintenanceJobs || 0) + (s.complianceAlertsCount || 0)}
          subtext={`${s.complianceAlertsCount || 0} Expiring Docs | ${s.criticalMaintenanceJobs || 0} Work Orders`}
          trend={s.complianceAlertsCount > 0 ? 'Action Req' : 'Compliant'}
          trendType={s.complianceAlertsCount > 0 ? 'negative' : 'positive'}
          color="warning"
        />
      </div>

      {/* Cross-Branch Comparative Performance */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Logistics Hub Distribution</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>
              Multi-branch capacity, asset allocation, and live operational velocity
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Hub Code</th>
                <th>City / Region</th>
                <th>Fleet Assigned</th>
                <th>Drivers Roster</th>
                <th>Active Trips</th>
                <th>Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    Loading hub infrastructure...
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b._id || b.code}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{b.name}</td>
                    <td><span className="badge badge-subtle">{b.code}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.city}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>{b.vehicleCount || 0} Units</td>
                    <td className="tabular-nums">{b.driverCount || 0} Operators</td>
                    <td className="tabular-nums" style={{ color: '#38bdf8', fontWeight: 600 }}>{b.activeTripsCount || 0} Active</td>
                    <td className="tabular-nums">{b.capacity || 50} Bays</td>
                    <td>
                      <span className="status-badge status-available">Operational</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Analytics & Security Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Global Trip Velocity Trend */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Platform Dispatch Velocity</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px' }}>
            System-wide dispatched journeys over 6 months
          </p>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.tripTrend || []}>
                <defs>
                  <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="trips" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#tripGrad)" name="Trips" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Audit & Security Event Stream */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Security &amp; Audit Trail</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Immutable ledger of enterprise operations</p>
            </div>
            <span className="badge badge-subtle">Live Feed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
            {recentLogs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                No recent audit events logged.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12.5px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{log.details || log.action}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                      By {log.userName || 'System User'} ({log.userRole || 'Admin'})
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
