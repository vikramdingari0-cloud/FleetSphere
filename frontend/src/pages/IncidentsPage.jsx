import React, { useState, useEffect } from 'react';
import { incidentsAPI, vehiclesAPI, driversAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  MapPin,
  Calendar,
  CheckCircle,
  Truck,
  User,
  DollarSign
} from 'lucide-react';

const IncidentsPage = () => {
  const { user, showToast } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    severity: 'Minor',
    location: '',
    description: '',
    estimatedLossAmount: 0
  });

  const [updateData, setUpdateData] = useState({
    status: 'Resolved',
    actionTaken: '',
    investigationNotes: '',
    insuranceClaimed: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, vRes, dRes] = await Promise.all([
        incidentsAPI.getAll(),
        vehiclesAPI.getAll(),
        driversAPI.getAll()
      ]);
      setIncidents(iRes.data);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      if (vRes.data.length > 0 && !formData.vehicleId) {
        setFormData((prev) => ({ ...prev, vehicleId: vRes.data[0]._id }));
      }
      if (dRes.data.length > 0 && !formData.driverId) {
        setFormData((prev) => ({ ...prev, driverId: dRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load incident records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReportIncident = async (e) => {
    e.preventDefault();
    try {
      await incidentsAPI.create(formData);
      showToast('Safety incident report filed.');
      setIsReportModalOpen(false);
      setFormData({
        vehicleId: vehicles[0]?._id || '',
        driverId: drivers[0]?._id || '',
        severity: 'Minor',
        location: '',
        description: '',
        estimatedLossAmount: 0
      });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    }
  };

  const openUpdateModal = (inc) => {
    setSelectedIncident(inc);
    setUpdateData({
      status: inc.status === 'Reported' ? 'Under Investigation' : 'Resolved',
      actionTaken: inc.actionTaken || '',
      investigationNotes: inc.investigationNotes || '',
      insuranceClaimed: inc.insuranceClaimed || false
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      await incidentsAPI.update(selectedIncident._id, updateData);
      showToast(`Incident ${selectedIncident.incidentNumber} updated!`);
      setIsUpdateModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Safety & Incident Records</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Accident reporting, risk assessment, damage loss claims, and investigations
          </p>
        </div>

        <button onClick={() => setIsReportModalOpen(true)} className="btn btn-danger">
          <AlertTriangle size={16} /> File Incident Report
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 0 }}>
        {['ALL', 'Critical', 'Severe', 'Moderate', 'Minor'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`filter-tab ${severityFilter === sev ? 'active' : ''}`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Incidents Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Incident # & Severity</th>
                <th>Location & Date</th>
                <th>Asset & Driver</th>
                <th>Description</th>
                <th>Estimated Loss</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No safety incidents reported matching criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((i) => (
                  <tr key={i._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f87171' }}>{i.incidentNumber}</div>
                        <div style={{ marginTop: '4px' }}>
                          <StatusBadge status={i.severity} />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#fff' }}>
                          <MapPin size={13} color="var(--text-dim)" />
                          <span>{i.location}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {new Date(i.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#38bdf8' }}>
                          <Truck size={13} />
                          <span>{i.vehicle?.plateNumber}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {i.driver?.user?.name}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px', color: '#fff', maxWidth: '260px' }}>
                        {i.description}
                      </div>
                      {i.actionTaken && (
                        <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>
                          Action: {i.actionTaken}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: '#fff' }}>
                        ${(i.estimatedLossAmount || 0).toLocaleString()}
                      </span>
                      <div style={{ fontSize: '10.5px', color: i.insuranceClaimed ? '#34d399' : 'var(--text-dim)' }}>
                        {i.insuranceClaimed ? 'Claimed' : 'Not Claimed'}
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={i.status} />
                    </td>

                    <td>
                      <button
                        onClick={() => openUpdateModal(i)}
                        className="btn btn-secondary btn-sm"
                      >
                        Update Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Incident Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Report Safety Incident">
        <form onSubmit={handleReportIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Involved Vehicle *</label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="form-select"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Commercial Driver</label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="form-select"
              >
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.user?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Severity Level *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="form-select"
              >
                <option value="Minor">Minor (Scuffs, Delay, Small Repair)</option>
                <option value="Moderate">Moderate (Tow Required, Cargo Safe)</option>
                <option value="Severe">Severe (Body Damage, Cargo Damage)</option>
                <option value="Critical">Critical (Collision, Total Loss)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated Loss / Damage ($)</label>
              <input
                type="number"
                value={formData.estimatedLossAmount}
                onChange={(e) => setFormData({ ...formData, estimatedLossAmount: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Accident / Incident Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. I-35 N Mile Marker 42, Ardmore, OK"
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Incident Detailed Narrative *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe road conditions, impact points, events leading up to incident..."
              className="form-textarea"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsReportModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              Submit Safety Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Incident Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Incident: ${selectedIncident?.incidentNumber}`}
      >
        <form onSubmit={handleUpdateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Investigation / Resolution Status</label>
            <select
              value={updateData.status}
              onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
              className="form-select"
            >
              <option value="Reported">Reported</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Action Required">Action Required</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Corrective Action Taken</label>
            <input
              type="text"
              value={updateData.actionTaken}
              onChange={(e) => setUpdateData({ ...updateData, actionTaken: e.target.value })}
              placeholder="e.g. Defensive driving course assigned, vehicle inspected"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Investigation Notes</label>
            <textarea
              rows={3}
              value={updateData.investigationNotes}
              onChange={(e) => setUpdateData({ ...updateData, investigationNotes: e.target.value })}
              placeholder="Add investigator findings and insurance coordination notes..."
              className="form-textarea"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0' }}>
            <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Incident Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncidentsPage;
