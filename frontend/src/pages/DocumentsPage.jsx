import React, { useState, useEffect } from 'react';
import { documentsAPI, vehiclesAPI, driversAPI, branchesAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
  Truck,
  User,
  Trash2
} from 'lucide-react';

const DocumentsPage = () => {
  const { user, showToast } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    documentType: 'Vehicle Registration',
    entityType: 'Vehicle',
    vehicle: '',
    driver: '',
    branch: '',
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    fileUrl: 'https://fleetsphere.storage/docs/sample_record.pdf',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, vRes, drRes, bRes] = await Promise.all([
        documentsAPI.getAll(),
        vehiclesAPI.getAll(),
        driversAPI.getAll(),
        branchesAPI.getAll()
      ]);
      setDocuments(dRes.data);
      setVehicles(vRes.data);
      setDrivers(drRes.data);
      setBranches(bRes.data);
      if (vRes.data.length > 0 && !formData.vehicle) {
        setFormData((prev) => ({ ...prev, vehicle: vRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load compliance vault', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    try {
      await documentsAPI.create(formData);
      showToast(`Document "${formData.title}" registered in vault!`);
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        documentType: 'Vehicle Registration',
        entityType: 'Vehicle',
        vehicle: vehicles[0]?._id || '',
        driver: '',
        branch: branches[0]?._id || '',
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        fileUrl: 'https://fleetsphere.storage/docs/sample_record.pdf',
        notes: ''
      });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save document', 'error');
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Delete this compliance record from the vault?')) return;
    try {
      await documentsAPI.delete(id);
      showToast('Document record deleted');
      loadData();
    } catch (err) {
      showToast('Failed to delete document', 'error');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    return true;
  });

  const expiringCount = documents.filter((d) => d.status === 'Expiring Soon').length;
  const expiredCount = documents.filter((d) => d.status === 'Expired').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Document & Regulatory Vault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Commercial registrations, insurance policies, permits, and automated expiry tracking
          </p>
        </div>

        {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Register New Document
          </button>
        )}
      </div>

      {/* Expiry Alerts Banner if any */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '14px' }}>
                Regulatory Compliance Notice
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                You have {expiringCount} document(s) expiring within 30 days and {expiredCount} expired document(s).
              </div>
            </div>
          </div>
          <button onClick={() => setStatusFilter('Expiring Soon')} className="btn btn-secondary btn-sm">
            View Expiring Docs
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 0 }}>
        {['ALL', 'Valid', 'Expiring Soon', 'Expired'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`filter-tab ${statusFilter === st ? 'active' : ''}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Type & Entity</th>
                <th>Associated Asset / Driver</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Vault Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No regulatory documents found in vault.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{doc.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          ID: {doc._id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontWeight: 500, color: '#fff' }}>{doc.documentType}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{doc.entityType}</div>
                      </div>
                    </td>

                    <td>
                      {doc.vehicle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#38bdf8' }}>
                          <Truck size={13} />
                          <span>{doc.vehicle.plateNumber}</span>
                        </div>
                      )}
                      {doc.driver && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#8b5cf6' }}>
                          <User size={13} />
                          <span>{doc.driver?.user?.name || 'Driver'}</span>
                        </div>
                      )}
                      {!doc.vehicle && !doc.driver && (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Organization Wide</span>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: doc.status === 'Expired' ? '#ef4444' : doc.status === 'Expiring Soon' ? '#f59e0b' : '#34d399'
                        }}
                      >
                        {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Perpetual'}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={doc.status} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-icon"
                          style={{ width: '30px', height: '30px' }}
                          title="Open PDF Document"
                        >
                          <ExternalLink size={14} />
                        </a>
                        {['Super Admin', 'Fleet Manager'].includes(user?.role) && (
                          <button
                            onClick={() => handleDeleteDocument(doc._id)}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px', color: '#f87171' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Document Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Upload Compliance Document">
        <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Document Official Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Commercial Vehicle Registration Certificate 2025"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Document Category *</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="form-select"
              >
                <option value="Vehicle Registration">Vehicle Registration</option>
                <option value="Vehicle Insurance">Vehicle Insurance</option>
                <option value="Road Permit">Road Permit</option>
                <option value="Emission Certificate">Emission Certificate</option>
                <option value="Driver License Scan">Driver License Scan</option>
                <option value="Medical Clearance">Medical Clearance</option>
                <option value="Trip Waybill">Trip Waybill</option>
                <option value="Maintenance Receipt">Maintenance Receipt</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Associated Entity *</label>
              <select
                value={formData.entityType}
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                className="form-select"
              >
                <option value="Vehicle">Vehicle Asset</option>
                <option value="Driver">Commercial Driver</option>
                <option value="Organization">Fleet / Organization</option>
              </select>
            </div>
          </div>

          {formData.entityType === 'Vehicle' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Vehicle Asset</label>
              <select
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                className="form-select"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.entityType === 'Driver' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Commercial Driver</label>
              <select
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                className="form-select"
              >
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.user?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expiration Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Secure Document URL / Cloud Link</label>
            <input
              type="text"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
