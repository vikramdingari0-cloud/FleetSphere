import React, { useState, useEffect } from 'react';
import { maintenanceAPI, vehiclesAPI, branchesAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Truck,
  DollarSign,
  UserCheck
} from 'lucide-react';

const MaintenancePage = () => {
  const { user, showToast } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'Preventive Maintenance',
    priority: 'Medium',
    scheduledDate: new Date().toISOString().slice(0, 10),
    estimatedCost: 650,
    serviceProvider: 'Metro Commercial Truck Fleet Care',
    workDescription: '',
    partsReplaced: ''
  });

  const [completeData, setCompleteData] = useState({
    actualCost: 0,
    partsReplaced: '',
    performedBy: '',
    completedOdometer: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, vRes, bRes] = await Promise.all([
        maintenanceAPI.getAll(),
        vehiclesAPI.getAll(),
        branchesAPI.getAll()
      ]);
      setJobs(mRes.data);
      setVehicles(vRes.data);
      setBranches(bRes.data);
      if (vRes.data.length > 0 && !formData.vehicleId) {
        setFormData((prev) => ({ ...prev, vehicleId: vRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load maintenance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleJob = async (e) => {
    e.preventDefault();
    try {
      const parts = formData.partsReplaced
        ? formData.partsReplaced.split(',').map((p) => p.trim())
        : [];
      await maintenanceAPI.create({ ...formData, partsReplaced: parts });
      showToast('Maintenance job scheduled successfully!');
      setIsScheduleModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule job', 'error');
    }
  };

  const openCompleteModal = (job) => {
    setSelectedJob(job);
    setCompleteData({
      actualCost: job.estimatedCost || 500,
      partsReplaced: (job.partsReplaced || []).join(', '),
      performedBy: job.performedBy || 'Certified Technician',
      completedOdometer: job.vehicle?.currentOdometer || 0
    });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteJob = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      const parts = completeData.partsReplaced
        ? completeData.partsReplaced.split(',').map((p) => p.trim())
        : [];
      await maintenanceAPI.update(selectedJob._id, {
        status: 'Completed',
        completedDate: new Date(),
        actualCost: Number(completeData.actualCost),
        partsReplaced: parts,
        performedBy: completeData.performedBy,
        completedOdometer: Number(completeData.completedOdometer)
      });
      showToast(`Work order ${selectedJob.jobNumber} marked completed! Vehicle returned to service.`);
      setIsCompleteModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete job', 'error');
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Maintenance & Fleet Health</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Work order lifecycle, service intervals, repair expenditures, and parts logging
          </p>
        </div>

        {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) && (
          <button onClick={() => setIsScheduleModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Open Work Order
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 0 }}>
        {['ALL', 'Scheduled', 'In Progress', 'Completed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`filter-tab ${statusFilter === st ? 'active' : ''}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Maintenance Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job # & Type</th>
                <th>Target Asset</th>
                <th>Priority</th>
                <th>Scheduled Date</th>
                <th>Cost Estimation</th>
                <th>Service Provider</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => (
                  <tr key={j._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: '#38bdf8' }}>{j.jobNumber}</div>
                        <div style={{ fontSize: '12.5px', color: '#fff', marginTop: '2px' }}>{j.type}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '220px' }}>
                          {j.workDescription}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={14} color="#0ea5e9" />
                        <span style={{ fontWeight: 600, color: '#fff' }}>
                          {j.vehicle?.plateNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {j.vehicle?.make} {j.vehicle?.model}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={j.priority} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        <Calendar size={13} />
                        <span>{new Date(j.scheduledDate).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          Est: ${j.estimatedCost || 0}
                        </div>
                        {j.actualCost > 0 && (
                          <div style={{ color: '#34d399', fontSize: '11.5px' }}>
                            Actual: ${j.actualCost}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12.5px', color: '#fff' }}>
                        {j.serviceProvider || 'In-House Depot'}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={j.status} />
                    </td>

                    <td>
                      {j.status !== 'Completed' && ['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) ? (
                        <button
                          onClick={() => openCompleteModal(j)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
                        >
                          <CheckCircle size={13} /> Complete Job
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {j.status === 'Completed' ? 'Closed' : 'Read-only'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Work Order Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Open Maintenance Work Order">
        <form onSubmit={handleScheduleJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Asset / Vehicle *</label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="form-select"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Service Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
              >
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Scheduled Service">Scheduled Service</option>
                <option value="Corrective Repair">Corrective Repair</option>
                <option value="Tire Replacement">Tire Replacement</option>
                <option value="Oil & Filter Change">Oil & Filter Change</option>
                <option value="Inspection">Inspection</option>
                <option value="Emergency Breakdown">Emergency Breakdown</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="form-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Scheduled Date *</label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Est. Cost ($)</label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Service Provider / Workshop</label>
            <input
              type="text"
              value={formData.serviceProvider}
              onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
              placeholder="e.g. Dallas Fleet Diagnostics & Overhaul"
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Work Scope & Diagnostic Description *</label>
            <textarea
              required
              rows={3}
              value={formData.workDescription}
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
              placeholder="Explain the required repairs, symptoms, or maintenance steps..."
              className="form-textarea"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Work Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Work Order Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Sign-Off Work Order: ${selectedJob?.jobNumber}`}
      >
        <form onSubmit={handleCompleteJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Final Actual Cost ($) *</label>
              <input
                type="number"
                required
                value={completeData.actualCost}
                onChange={(e) => setCompleteData({ ...completeData, actualCost: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Service Odometer (km)</label>
              <input
                type="number"
                value={completeData.completedOdometer}
                onChange={(e) => setCompleteData({ ...completeData, completedOdometer: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Lead Technician / Performed By</label>
            <input
              type="text"
              value={completeData.performedBy}
              onChange={(e) => setCompleteData({ ...completeData, performedBy: e.target.value })}
              placeholder="e.g. Master Tech Jim S."
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Replacement Parts (Comma separated)</label>
            <input
              type="text"
              value={completeData.partsReplaced}
              onChange={(e) => setCompleteData({ ...completeData, partsReplaced: e.target.value })}
              placeholder="Brake Pads OEM, Oil Filter, Hydraulic Hose"
              className="form-input"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Complete & Return Asset to Fleet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
