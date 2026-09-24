import React, { useState, useEffect } from 'react';
import { vehiclesAPI, branchesAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import DetailDrawer from '../components/common/DetailDrawer';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  BatteryCharging,
  Fuel,
  Gauge,
  Eye
} from 'lucide-react';

const VehiclesPage = () => {
  const { user, showToast } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [formData, setFormData] = useState({
    vin: '',
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'Heavy Duty Truck',
    fuelType: 'Diesel',
    fuelCapacity: 450,
    currentOdometer: 0,
    serviceIntervalKm: 15000,
    branch: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, bRes] = await Promise.all([
        vehiclesAPI.getAll({ search: search || undefined }),
        branchesAPI.getAll()
      ]);
      setVehicles(vRes.data);
      setBranches(bRes.data);
      if (bRes.data.length > 0 && !formData.branch) {
        setFormData((prev) => ({ ...prev, branch: bRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load fleet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      await vehiclesAPI.updateStatus(vehicleId, newStatus);
      showToast(`Vehicle status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Status update failed', 'error');
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await vehiclesAPI.create(formData);
      showToast(`Vehicle ${formData.plateNumber} added to fleet!`);
      setIsAddModalOpen(false);
      setFormData({
        vin: '',
        plateNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'Heavy Duty Truck',
        fuelType: 'Diesel',
        fuelCapacity: 450,
        currentOdometer: 0,
        serviceIntervalKm: 15000,
        branch: branches[0]?._id || ''
      });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create vehicle', 'error');
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Fleet & Commercial Assets</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Telemetry, vehicle health, service scheduling, and asset deployment
          </p>
        </div>

        {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) && (
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Add Vehicle Asset
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {['ALL', 'Available', 'In Transit', 'Maintenance', 'Out of Service'].map((st) => (
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
            placeholder="Search VIN, plate, make..."
            className="form-input"
            style={{ paddingLeft: '38px', height: '38px' }}
          />
        </div>
      </div>

      {/* Vehicles Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vehicle / Asset</th>
                <th>Type & Fuel</th>
                <th>Hub Branch</th>
                <th>Odometer</th>
                <th>Service Status</th>
                <th>Status</th>
                <th>Operational Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No fleet vehicles found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                            color: '#38bdf8'
                          }}
                        >
                          <Truck size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>
                            {v.plateNumber}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {v.year} {v.make} {v.model}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                            VIN: {v.vin}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <div style={{ fontWeight: 500, color: '#fff' }}>{v.type}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {v.fuelType === 'Electric' ? (
                            <BatteryCharging size={12} color="#10b981" />
                          ) : (
                            <Fuel size={12} color="#f59e0b" />
                          )}
                          <span>
                            {v.fuelType} ({v.fuelCapacity} {v.fuelType === 'Electric' ? 'kWh' : 'L'})
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '13px', color: '#fff' }}>
                        {v.branch?.name || 'Unassigned'}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {v.branch?.city}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gauge size={14} color="var(--text-dim)" />
                        <span style={{ fontWeight: 600, color: '#fff' }}>
                          {v.currentOdometer.toLocaleString()} km
                        </span>
                      </div>
                    </td>

                    <td>
                      {v.isOverdueForService ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#f87171',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'rgba(239,68,68,0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          <AlertTriangle size={13} /> Overdue ({v.nextServiceDueKm ? `${v.nextServiceDueKm.toLocaleString()} km` : 'Now'})
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#34d399',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          <CheckCircle2 size={13} /> Next: {v.nextServiceDueKm?.toLocaleString()} km
                        </span>
                      )}
                    </td>

                    <td>
                      <StatusBadge status={v.status} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedVehicle(v)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Inspect Vehicle Telematics"
                        >
                          <Eye size={13} />
                        </button>
                        {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) ? (
                          <select
                            value={v.status}
                            onChange={(e) => handleStatusChange(v._id, e.target.value)}
                            className="form-select"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              height: '30px',
                              width: '135px'
                            }}
                          >
                            <option value="Available">Available</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Out of Service">Out of Service</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Read-only</span>
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

      {/* Add Vehicle Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Commercial Vehicle">
        <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Plate / Tag Number *</label>
              <input
                type="text"
                required
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                placeholder="e.g. TX-COMM-992"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">VIN (17 Digits) *</label>
              <input
                type="text"
                required
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="1FT8W3BT9NED..."
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Manufacturer / Make *</label>
              <input
                type="text"
                required
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="Volvo Trucks, Ford, Peterbilt"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Model *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="VNL 860, Transit"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Classification / Body Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
              >
                <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                <option value="Delivery Van">Delivery Van</option>
                <option value="Cargo Semi">Cargo Semi</option>
                <option value="Electric Van">Electric Van</option>
                <option value="Sedan Fleet">Sedan Fleet</option>
                <option value="Pickup 4x4">Pickup 4x4</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fuel Architecture</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="form-select"
              >
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Gasoline">Gasoline</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Capacity (Liters or kWh)</label>
              <input
                type="number"
                required
                value={formData.fuelCapacity}
                onChange={(e) => setFormData({ ...formData, fuelCapacity: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Initial Odometer (km)</label>
              <input
                type="number"
                value={formData.currentOdometer}
                onChange={(e) => setFormData({ ...formData, currentOdometer: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Service Cycle (km interval)</label>
              <input
                type="number"
                value={formData.serviceIntervalKm}
                onChange={(e) => setFormData({ ...formData, serviceIntervalKm: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assigned Hub Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="form-select"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title={selectedVehicle ? `${selectedVehicle.plateNumber}` : 'Vehicle'}
        subtitle={selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : ''}
        badge={selectedVehicle?.status}
        badgeType={selectedVehicle?.status === 'Available' ? 'available' : 'warning'}
        sections={[
          {
            title: 'Asset Specifications',
            items: [
              { label: 'VIN', value: selectedVehicle?.vin },
              { label: 'Vehicle Type', value: selectedVehicle?.type },
              { label: 'Fuel / Energy Type', value: selectedVehicle?.fuelType },
              { label: 'Tank / Battery Capacity', value: `${selectedVehicle?.fuelCapacity} L/kWh` }
            ]
          },
          {
            title: 'Telematics & Maintenance',
            items: [
              { label: 'Current Odometer', value: `${selectedVehicle?.currentOdometer?.toLocaleString()} km` },
              { label: 'Service Interval', value: `Every ${selectedVehicle?.serviceIntervalKm?.toLocaleString()} km` },
              { label: 'Next Service Due', value: `${selectedVehicle?.nextServiceDueKm?.toLocaleString() || 'N/A'} km` },
              { label: 'Service Health', value: selectedVehicle?.isOverdueForService ? 'OVERDUE' : 'Compliant' }
            ]
          },
          {
            title: 'Facility Assignment',
            items: [
              { label: 'Assigned Hub', value: selectedVehicle?.branch?.name || 'Local Logistics Hub' },
              { label: 'Region / City', value: selectedVehicle?.branch?.city || 'Regional Depot' }
            ]
          }
        ]}
      />
    </div>
  );
};

export default VehiclesPage;
