import React from 'react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Building2,
  Truck,
  Users,
  Navigation,
  Wrench,
  FileText,
  AlertTriangle,
  Plus,
  DollarSign
} from 'lucide-react';

const BranchManagerDashboard = ({ data, user, setActiveTab }) => {
  const s = data?.summary || {};
  const branchName = user?.branch?.name || 'Local Logistics Hub';
  const branchCode = user?.branch?.code || 'BRANCH-01';
  const branchCity = user?.branch?.city || 'Regional Depot';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Branch Context Banner */}
      <div className="branch-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}
          >
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="role-badge branch-manager">
                Branch Command
              </span>
              <span className="badge badge-subtle">{branchCode}</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: '#fff' }}>
              {branchName}
            </h1>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Location: {branchCity} &bull; Data strictly isolated to this facility
            </span>
          </div>
        </div>

        <button onClick={() => setActiveTab('trips')} className="btn btn-primary btn-sm">
          <Plus size={14} /> Dispatch Local Trip
        </button>
      </div>

      {/* Branch Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <StatCard
          icon={Truck}
          title="Branch Fleet Units"
          value={s.totalVehicles || 0}
          subtext={`${s.availableVehicles || 0} Available | ${s.inTransitVehicles || 0} In Transit`}
          trend={`${s.fleetHealthRate || 100}% Ready`}
          trendType="positive"
          color="primary"
        />
        <StatCard
          icon={Users}
          title="Assigned Drivers"
          value={s.totalDrivers || 0}
          subtext={`${s.onDutyDrivers || 0} On Duty | ${s.availableDrivers || 0} Standby`}
          trend={`${s.avgSafetyScore || 4.8}★ Safety`}
          trendType="positive"
          color="success"
        />
        <StatCard
          icon={Navigation}
          title="Active Dispatches"
          value={s.activeTrips || 0}
          subtext={`${s.plannedTrips || 0} Planned Dispatches`}
          trend="Local Tracking"
          trendType="neutral"
          color="cyan"
        />
        <StatCard
          icon={FileText}
          title="Expiring Documents"
          value={s.complianceAlertsCount || 0}
          subtext="Permits &amp; Inspections"
          trend={s.complianceAlertsCount > 0 ? 'Action Req' : 'Up to Date'}
          trendType={s.complianceAlertsCount > 0 ? 'negative' : 'positive'}
          color="warning"
        />
      </div>

      {/* Operational Modules Quick Access for Branch */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Local Maintenance Status */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Branch Maintenance Bay</h3>
            </div>
            <button onClick={() => setActiveTab('maintenance')} className="btn btn-secondary btn-sm">
              Work Orders
            </button>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            There are currently <strong style={{ color: '#fff' }}>{s.activeMaintenanceJobs || 0}</strong> active maintenance job(s)
            and <strong style={{ color: s.overdueServiceCount > 0 ? '#ef4444' : '#10b981' }}>{s.overdueServiceCount || 0}</strong> vehicle(s) overdue for servicing at this location.
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <span className="badge badge-subtle">{s.maintenanceVehicles || 0} Vehicles in Bay</span>
            <span className="badge badge-subtle">${Number(s.totalMaintenanceSpend || 0).toLocaleString()} Service Spend</span>
          </div>
        </div>

        {/* Local Expense Summary */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign size={18} color="#10b981" />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Branch Operating Ledger</h3>
            </div>
            <button onClick={() => setActiveTab('expenses')} className="btn btn-secondary btn-sm">
              View Expenses
            </button>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Branch approved expenses total <strong style={{ color: '#fff' }}>${Number(s.totalApprovedExpenses || 0).toLocaleString()}</strong> with <strong style={{ color: '#38bdf8' }}>{s.pendingExpensesCount || 0}</strong> claims pending review.
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <span className="badge badge-subtle">${Number(s.totalFuelSpend || 0).toLocaleString()} Fuel Spend</span>
            <span className="badge badge-subtle">{s.pendingExpensesCount || 0} Pending Approvals</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchManagerDashboard;
