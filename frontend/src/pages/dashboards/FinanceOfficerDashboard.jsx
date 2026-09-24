import React, { useState } from 'react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { expensesAPI } from '../../services/api';
import {
  DollarSign,
  Fuel,
  Wrench,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  FileCheck,
  Receipt,
  PieChart as PieIcon
} from 'lucide-react';
import {
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

const FinanceOfficerDashboard = ({ data, setActiveTab, onRefresh, showToast }) => {
  const s = data?.summary || {};
  const charts = data?.charts || {};
  const finance = data?.roleContext?.finance || {};
  const pendingQueue = finance.pendingApprovalQueue || [];
  const categoryBreakdown = finance.categoryBreakdown || [];

  const [processingId, setProcessingId] = useState(null);

  const handleApproveExpense = async (id) => {
    try {
      setProcessingId(id);
      await expensesAPI.updateStatus(id, { status: 'Approved' });
      showToast && showToast('Expense claim approved and recorded in general ledger.');
      onRefresh && onRefresh();
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectExpense = async (id) => {
    const reason = window.prompt('Please enter the reason for rejecting this claim:');
    if (reason === null) return;
    try {
      setProcessingId(id);
      await expensesAPI.updateStatus(id, { status: 'Rejected', rejectionReason: reason || 'Not approved by finance' });
      showToast && showToast('Expense claim rejected.', 'info');
      onRefresh && onRefresh();
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Finance Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="role-badge finance-officer">
              <FileCheck size={13} /> Finance &amp; Audit Command
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Operating Expenditure Ledger &bull; Fleet Cost Accountability
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
            Financial Ledger &amp; Operating Cost Accounting
          </h1>
        </div>

        <button onClick={() => setActiveTab('expenses')} className="btn btn-primary btn-sm">
          <Receipt size={14} /> Full Expense Ledger
        </button>
      </div>

      {/* Finance KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <StatCard
          icon={DollarSign}
          title="Total Approved Spend"
          value={`$${Number(s.totalApprovedExpenses || 0).toLocaleString()}`}
          subtext="Verified operational claims"
          trend="General Ledger"
          trendType="positive"
          color="primary"
        />
        <StatCard
          icon={AlertCircle}
          title="Pending Review Queue"
          value={s.pendingExpensesCount || 0}
          subtext="Requires authorization"
          trend={s.pendingExpensesCount > 0 ? 'Action Pending' : 'Clear'}
          trendType={s.pendingExpensesCount > 0 ? 'negative' : 'positive'}
          color="warning"
        />
        <StatCard
          icon={Fuel}
          title="Fuel Telematics Spend"
          value={`$${Number(s.totalFuelSpend || 0).toLocaleString()}`}
          subtext={`${Number(s.totalFuelLiters || 0).toLocaleString()} liters consumed`}
          trend="Automated Billing"
          trendType="neutral"
          color="cyan"
        />
        <StatCard
          icon={Wrench}
          title="Maintenance Investment"
          value={`$${Number(s.totalMaintenanceSpend || 0).toLocaleString()}`}
          subtext={`${s.activeMaintenanceJobs || 0} active work orders`}
          trend="Lifecycle Upkeep"
          trendType="neutral"
          color="purple"
        />
      </div>

      {/* Pending Expense Approvals Queue */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Priority Expense Review Queue</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>
              Pending driver and operational receipts requiring finance sign-off
            </p>
          </div>
          <span className="badge badge-subtle">{pendingQueue.length} Claims Awaiting Review</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Driver / Claimant</th>
                <th>Vehicle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                    No pending expense claims currently require review.
                  </td>
                </tr>
              ) : (
                pendingQueue.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.title}</td>
                    <td><span className="badge badge-subtle">{item.category}</span></td>
                    <td className="tabular-nums" style={{ fontWeight: 700, color: '#10b981' }}>
                      ${Number(item.amount).toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.driver?.user?.name || 'Operations Staff'}</td>
                    <td>{item.vehicle?.plateNumber || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          disabled={processingId === item._id}
                          onClick={() => handleApproveExpense(item._id)}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#10b981', color: '#fff', padding: '4px 8px' }}
                          title="Approve claim"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          disabled={processingId === item._id}
                          onClick={() => handleRejectExpense(item._id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Reject claim"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Expenditure Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Operating Spend by Category */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Expenditure by Category</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px' }}>
            Audited claims distribution across operational categories
          </p>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown.map((c, i) => ({ name: c._id, value: c.total }))}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `$${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px', fontSize: '11.5px' }}>
            {categoryBreakdown.map((c, i) => (
              <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--text-muted)' }}>{c._id}:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>${Number(c.total).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Cost Trends */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Rolling Monthly Cost Analysis</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px' }}>
            Monthly operational expenditure over 6-month cycle
          </p>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.costTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip
                  formatter={(val) => `$${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="fuel" fill="#0ea5e9" name="Fuel ($)" />
                <Bar dataKey="maintenance" fill="#8b5cf6" name="Maintenance ($)" />
                <Bar dataKey="expenses" fill="#10b981" name="Direct Claims ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceOfficerDashboard;
