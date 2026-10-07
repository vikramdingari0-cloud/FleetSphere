import React, { useState, useEffect } from 'react';
import { expensesAPI, vehiclesAPI, driversAPI, branchesAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { exportToCSV } from '../utils/csvExport';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  Filter,
  FileText,
  Clock,
  Truck,
  UserCheck,
  Download
} from 'lucide-react';

const ExpensesPage = () => {
  const { user, showToast } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Toll Fees',
    amount: '',
    vehicle: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eRes, vRes, bRes] = await Promise.all([
        expensesAPI.getAll(),
        vehiclesAPI.getAll(),
        branchesAPI.getAll()
      ]);
      setExpenses(eRes.data);
      setVehicles(vRes.data);
      setBranches(bRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (expenseId, status, reason = '') => {
    try {
      await expensesAPI.updateStatus(expenseId, { status, rejectionReason: reason });
      showToast(`Expense claim marked as ${status}`);
      setIsRejectModalOpen(false);
      setRejectionReason('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await expensesAPI.create(formData);
      showToast('Expense claim filed successfully!');
      setIsSubmitModalOpen(false);
      setFormData({
        title: '',
        category: 'Toll Fees',
        amount: '',
        vehicle: '',
        notes: ''
      });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit expense', 'error');
    }
  };

  const openRejectModal = (expense) => {
    setSelectedExpense(expense);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const canApprove = ['Super Admin', 'Fleet Manager', 'Finance Officer', 'Branch Manager'].includes(user?.role);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleExportCSV = () => {
    const headers = [
      { label: 'Title', accessor: 'title' },
      { label: 'Category', accessor: 'category' },
      { label: 'Amount ($)', accessor: 'amount' },
      { label: 'Vehicle Plate', accessor: (e) => e.vehicle?.plateNumber || '' },
      { label: 'Driver', accessor: (e) => e.driver?.user?.name || '' },
      { label: 'Date', accessor: (e) => new Date(e.date).toLocaleDateString() },
      { label: 'Status', accessor: 'status' }
    ];
    exportToCSV('fleetsphere_expenses', headers, filteredExpenses);
  };

  const filteredExpenses = expenses.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalSpend = expenses
    .filter((e) => e.status === 'Approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingSpend = expenses
    .filter((e) => e.status === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Operating Expenses & Audit</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Toll fees, parking vouchers, maintenance claims, and financial approval workflow
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            title="Export expenses to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setIsSubmitModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Submit Expense Claim
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 24px' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Approved Disbursed Spend</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px' }}>Audited & Approved</div>
        </div>

        <div className="card" style={{ padding: '18px 24px' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Pending Financial Approval</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            ${pendingSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {expenses.filter((e) => e.status === 'Pending').length} Pending Claims
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 0 }}>
        {['ALL', 'Pending', 'Approved', 'Rejected'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setCurrentPage(1);
            }}
            className={`filter-tab ${statusFilter === st ? 'active' : ''}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Expense Title & Category</th>
                <th>Amount ($)</th>
                <th>Asset / Driver</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Finance Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No expense claims match the criteria.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{exp.title}</div>
                        <div
                          style={{
                            display: 'inline-block',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '2px'
                          }}
                        >
                          {exp.category}
                        </div>
                        {exp.notes && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {exp.notes}
                          </div>
                        )}
                        {exp.rejectionReason && (
                          <div style={{ fontSize: '11.5px', color: '#f87171', marginTop: '2px' }}>
                            Rejected: {exp.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                        ${exp.amount?.toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <div>
                        {exp.vehicle && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#38bdf8' }}>
                            <Truck size={13} />
                            <span>{exp.vehicle.plateNumber}</span>
                          </div>
                        )}
                        {exp.driver?.user?.name && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {exp.driver.user.name}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {new Date(exp.date).toLocaleDateString()}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={exp.status} />
                    </td>

                    <td>
                      {exp.status === 'Pending' && canApprove ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleStatusUpdate(exp._id, 'Approved')}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(exp)}
                            className="btn btn-danger btn-sm"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {exp.status === 'Approved' ? `Approved by ${exp.approvedBy?.name || 'Finance'}` : exp.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredExpenses.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Submit Expense Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="File Expense Claim">
        <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Expense Description / Purpose *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Turnpike toll pass, secure overnight staging"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                <option value="Toll Fees">Toll Fees</option>
                <option value="Parking">Parking</option>
                <option value="Driver Allowance">Driver Allowance</option>
                <option value="Insurance">Insurance</option>
                <option value="Licensing & Permits">Licensing & Permits</option>
                <option value="Vehicle Wash">Vehicle Wash</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Emergency Repair">Emergency Repair</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="45.00"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Related Vehicle Asset (Optional)</label>
            <select
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              className="form-select"
            >
              <option value="">General Corporate / No vehicle</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.plateNumber} ({v.make} {v.model})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes & Justification</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Provide reason, route context, or expense receipt number..."
              className="form-textarea"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit for Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={`Reject Claim: ${selectedExpense?.title}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Rejection Reason / Audit Note *</label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Missing valid merchant receipt, exceeds per diem rate..."
              className="form-textarea"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button type="button" onClick={() => setIsRejectModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate(selectedExpense._id, 'Rejected', rejectionReason)}
              className="btn btn-danger"
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
