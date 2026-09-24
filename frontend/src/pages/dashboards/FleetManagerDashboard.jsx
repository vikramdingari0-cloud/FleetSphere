import React from 'react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Truck,
  Navigation,
  Wrench,
  Fuel,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus,
  Compass
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const FleetManagerDashboard = ({ data, setActiveTab }) => {
  const s = data?.summary || {};
  const charts = data?.charts || {};
  const statusDist = charts.vehicleStatusDistribution || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="role-badge fleet-manager">
              <Compass size={13} /> Fleet Command Center
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Operational Telematics &amp; Live Asset Orchestration
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            Fleet Operations &amp; Dispatch Monitoring
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveTab('trips')} className="btn btn-primary btn-sm">
            <Plus size={14} /> Plan &amp; Dispatch Trip
          </button>
          <button onClick={() => setActiveTab('maintenance')} className="btn btn-secondary btn-sm">
            <Wrench size={14} /> Schedule Service
          </button>
        </div>
      </div>

      {/* Operational Attention Required Banner if any */}
      {(s.overdueServiceCount > 0 || s.criticalMaintenanceJobs > 0) && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '13.5px' }}>
                Operational Attention Required: Fleet Readiness Flags
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {s.overdueServiceCount || 0} vehicle(s) overdue for maintenance &bull; {s.criticalMaintenanceJobs || 0} critical work orders in progress
              </div>
            </div>
          </div>
          <button onClick={() => setActiveTab('maintenance')} className="btn btn-secondary btn-sm">
            Review Work Orders
          </button>
        </div>
      )}

      {/* Operational KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <StatCard
          icon={Truck}
          title="Active Fleet Size"
          value={s.totalVehicles || 0}
          subtext={`${s.availableVehicles || 0} Ready | ${s.inTransitVehicles || 0} En Route`}
          trend={`${s.fleetHealthRate || 100}% Ready`}
          trendType="positive"
          color="primary"
        />
        <StatCard
          icon={Navigation}
          title="Active Dispatches"
          value={s.activeTrips || 0}
          subtext={`${s.plannedTrips || 0} Scheduled Trips`}
          trend="Real-Time Tracking"
          trendType="neutral"
          color="success"
        />
        <StatCard
          icon={Wrench}
          title="Vehicles in Service"
          value={s.maintenanceVehicles || 0}
          subtext={`${s.overdueServiceCount || 0} Overdue for Service`}
          trend={s.overdueServiceCount > 0 ? 'Service Due' : 'Healthy'}
          trendType={s.overdueServiceCount > 0 ? 'negative' : 'positive'}
          color="warning"
        />
        <StatCard
          icon={Fuel}
          title="Avg Fuel Efficiency"
          value={`${s.fleetAvgEfficiency || 3.8} km/L`}
          subtext={`$${Number(s.totalFuelSpend || 0).toLocaleString()} spent this cycle`}
          trend="Eco Benchmark"
          trendType="positive"
          color="cyan"
        />
      </div>

      {/* 2-Column Operational Distribution & Cost Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Fleet Status Pie Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Fleet Readiness Distribution</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px' }}>
            Current allocation status across all active vehicles
          </p>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Status Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
            {statusDist.map((entry) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.fill }} />
                <span style={{ color: 'var(--text-muted)' }}>{entry.name}:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Expenditure Trend */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Operating Expenditure Breakdown</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px' }}>
            Fuel telemetry vs. Maintenance investment over 6 months
          </p>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.costTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="fuel" fill="#0ea5e9" name="Fuel ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenance" fill="#f59e0b" name="Maintenance ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#0ea5e9' }} />
              <span style={{ color: 'var(--text-muted)' }}>Fuel Telematics</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
              <span style={{ color: 'var(--text-muted)' }}>Scheduled Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetManagerDashboard;
