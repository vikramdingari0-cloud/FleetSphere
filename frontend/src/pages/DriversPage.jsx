import React, { useState, useEffect } from 'react';
import { driversAPI, vehiclesAPI, branchesAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Star,
  Shield,
  Plus,
  Search,
  Phone,
  Mail,
  Award,
  Calendar,
  Truck
} from 'lucide-react';

const DriversPage = () => {
  const { user, showToast } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    licenseNumber: '',
    licenseClass: 'Class A CDL (Commercial Heavy)',
    licenseExpiryDate: '2027-12-31',
    drivingExperienceYears: 5,
    branchId: '',
    assignedVehicleId: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, bRes, vRes] = await Promise.all([
        driversAPI.getAll(),
        branchesAPI.getAll(),
        vehiclesAPI.getAll({ status: 'Available' })
      ]);
      setDrivers(dRes.data);
      setBranches(bRes.data);
      setVehicles(vRes.data);
      if (bRes.data.length > 0 && !formData.branchId) {
        setFormData((prev) => ({ ...prev, branchId: bRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load driver roster', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (driverId, newStatus) => {
    try {
      await driversAPI.update(driverId, { status: newStatus });
      showToast(`Driver status set to ${newStatus}`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      await driversAPI.create(formData);
      showToast(`Driver profile created for ${formData.name}!`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create driver', 'error');
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = d.user?.name?.toLowerCase() || '';
      const lic = d.licenseNumber?.toLowerCase() || '';
      return name.includes(q) || lic.includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Commercial Driver Roster</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Licensing compliance, safety ratings, duty status, and vehicle assignments
          </p>
        </div>

        {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Onboard New Driver
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {['ALL', 'Available', 'On Duty', 'Off Duty', 'Suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`filter-tab ${statusFilter === st ? 'active' : ''}`}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search driver by name or license..."
            className="form-input"
            style={{ paddingLeft: '38px', height: '38px' }}
          />
        </div>
      </div>

      {/* Drivers Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px'
        }}
      >
        {filteredDrivers.map((d) => (
          <div key={d._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '18px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {d.user?.name ? d.user.name.charAt(0) : 'D'}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{d.user?.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                      {d.safetyRating}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      • {d.drivingExperienceYears} yrs exp
                    </span>
                  </div>
                </div>
              </div>

              <StatusBadge status={d.status} />
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--text-dim)" />
                  <span>{d.user?.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--text-dim)" />
                  <span>{d.user?.phone || '+1 (555) 019-9238'}</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>License ID:</span>
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>{d.licenseNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Class:</span>
                  <span style={{ color: '#fff' }}>{d.licenseClass}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Expires:</span>
                  <span style={{ color: new Date(d.licenseExpiryDate) < new Date() ? '#ef4444' : '#10b981' }}>
                    {new Date(d.licenseExpiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{d.totalTripsCompleted || 0}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Trips Delivered</div>
                </div>
                <div style={{ background: 'var(--bg-app)', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                    {(d.totalDistanceDrivenKm || 0).toLocaleString()} km
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Distance Logged</div>
                </div>
              </div>

              {/* Status Switcher Footer */}
              {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) && (
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Duty Status:
                    </span>
                    <select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d._id, e.target.value)}
                      className="form-select"
                      style={{ width: '130px', height: '28px', padding: '2px 8px', fontSize: '11.5px' }}
                    >
                      <option value="Available">Available</option>
                      <option value="On Duty">On Duty</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Onboard Driver Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Onboard Commercial Driver">
        <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Robert Hawkins"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Work Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="driver.robert@fleetsphere.com"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Contact *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CDL License Number *</label>
              <input
                type="text"
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="TX-CDL-882914"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">CDL License Class *</label>
              <select
                value={formData.licenseClass}
                onChange={(e) => setFormData({ ...formData, licenseClass: e.target.value })}
                className="form-select"
              >
                <option value="Class A CDL (Commercial Heavy)">Class A CDL (Commercial Heavy)</option>
                <option value="Class A CDL (Double/Triple & HazMat)">Class A CDL (Double/Triple & HazMat)</option>
                <option value="Class B CDL (Passenger & Delivery)">Class B CDL (Passenger & Delivery)</option>
                <option value="Commercial Chauffeur / Van">Commercial Chauffeur / Van</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">License Expiration Date *</label>
              <input
                type="date"
                required
                value={formData.licenseExpiryDate}
                onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Driving Experience (Years)</label>
              <input
                type="number"
                value={formData.drivingExperienceYears}
                onChange={(e) => setFormData({ ...formData, drivingExperienceYears: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Driver Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DriversPage;
