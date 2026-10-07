import React, { useState, useEffect } from 'react';
import { tripsAPI, vehiclesAPI, driversAPI, branchesAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import FleetMap from '../components/common/FleetMap';
import Pagination from '../components/common/Pagination';
import { exportToCSV } from '../utils/csvExport';
import { useAuth } from '../context/AuthContext';
import {
  Navigation,
  Plus,
  Search,
  MapPin,
  Calendar,
  Truck,
  User,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  FileText,
  Download,
  Map
} from 'lucide-react';

const TripsPage = () => {
  const { user, showToast } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    estimatedDistanceKm: 350,
    plannedDepartureTime: new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16),
    plannedArrivalTime: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16),
    vehicleId: '',
    driverId: '',
    branchId: '',
    cargoDetails: '',
    cargoWeightKg: 10000
  });

  const [statusUpdateData, setStatusUpdateData] = useState({
    status: 'Started',
    notes: '',
    location: '',
    delayReason: '',
    odometer: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, vRes, dRes, bRes] = await Promise.all([
        tripsAPI.getAll({ search: search || undefined }),
        vehiclesAPI.getAll({ status: 'Available' }),
        driversAPI.getAll({ status: 'Available' }),
        branchesAPI.getAll()
      ]);
      setTrips(tRes.data);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      setBranches(bRes.data);
      if (bRes.data.length > 0 && !formData.branchId) {
        setFormData((prev) => ({ ...prev, branchId: bRes.data[0]._id }));
      }
      if (vRes.data.length > 0 && !formData.vehicleId) {
        setFormData((prev) => ({ ...prev, vehicleId: vRes.data[0]._id }));
      }
      if (dRes.data.length > 0 && !formData.driverId) {
        setFormData((prev) => ({ ...prev, driverId: dRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading dispatch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await tripsAPI.create(formData);
      showToast('Trip scheduled & dispatched successfully!');
      setIsDispatchModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Dispatch conflict or failure', 'error');
    }
  };

  const openStatusUpdater = (trip) => {
    setSelectedTrip(trip);
    setStatusUpdateData({
      status: trip.status === 'Assigned' ? 'Started' : trip.status === 'Started' ? 'Completed' : 'Started',
      notes: '',
      location: '',
      delayReason: '',
      odometer: trip.vehicle?.currentOdometer || 0
    });
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTrip) return;
    try {
      await tripsAPI.updateStatus(selectedTrip._id, statusUpdateData);
      showToast(`Trip ${selectedTrip.tripNumber} status advanced to ${statusUpdateData.status}`);
      setIsStatusModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update trip status', 'error');
    }
  };

  const [showMap, setShowMap] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleExportCSV = () => {
    const headers = [
      { label: 'Trip Number', accessor: 'tripNumber' },
      { label: 'Origin', accessor: 'origin' },
      { label: 'Destination', accessor: 'destination' },
      { label: 'Est Distance (km)', accessor: 'estimatedDistanceKm' },
      { label: 'Actual Distance (km)', accessor: (t) => t.actualDistanceKm || '' },
      { label: 'Vehicle Plate', accessor: (t) => t.vehicle?.plateNumber || '' },
      { label: 'Driver', accessor: (t) => t.driver?.user?.name || '' },
      { label: 'Cargo Details', accessor: 'cargoDetails' },
      { label: 'Departure Time', accessor: 'plannedDepartureTime' },
      { label: 'Arrival Time', accessor: 'plannedArrivalTime' },
      { label: 'Status', accessor: 'status' }
    ];
    exportToCSV('fleetsphere_dispatches', headers, filteredTrips);
  };

  const filteredTrips = trips.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1;
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Dispatch & Route Orchestration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Multi-stop logistics dispatch, conflict-aware scheduling, and live tracking
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn btn-secondary"
            title="Toggle corridor telemetry map"
          >
            <Map size={15} /> {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            title="Export filtered dispatches to CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          {['Super Admin', 'Fleet Manager', 'Branch Manager'].includes(user?.role) && (
            <button onClick={() => setIsDispatchModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Schedule New Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Interactive Fleet Telemetry & Transit Corridor Map */}
      {showMap && (
        <FleetMap
          vehicles={vehicles}
          trips={trips}
          branches={branches}
          onSelectVehicle={(veh) => {
            showToast(`Selected Asset ${veh.plateNumber}: In Transit (${veh.branch?.name || 'Hub'})`);
          }}
        />
      )}

      {/* Filter Tabs & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          {['ALL', 'Started', 'Assigned', 'Planned', 'Delayed', 'Completed', 'Cancelled'].map((st) => (
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

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search trip ID, origin, cargo..."
            className="form-input"
            style={{ paddingLeft: '38px', height: '38px' }}
          />
        </div>
      </div>

      {/* Trips Table Card */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Trip ID & Cargo</th>
                <th>Route (Origin ➔ Destination)</th>
                <th>Vehicle & Driver</th>
                <th>Schedule Timeline</th>
                <th>Status</th>
                <th>Lifecycle Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No trips found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedTrips.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13.5px' }}>
                          {t.tripNumber}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#fff', marginTop: '2px' }}>
                          {t.cargoDetails || 'General Freight'}
                        </div>
                        {t.cargoWeightKg && (
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                            Weight: {t.cargoWeightKg.toLocaleString()} kg
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#fff' }}>
                          <MapPin size={13} color="#10b981" />
                          <span>{t.origin}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#fff' }}>
                          <ArrowRight size={13} color="var(--text-dim)" />
                          <span>{t.destination}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          Est. Distance: {t.estimatedDistanceKm} km {t.actualDistanceKm ? `(Actual: ${t.actualDistanceKm} km)` : ''}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#fff' }}>
                          <Truck size={13} color="#0ea5e9" />
                          <span style={{ fontWeight: 600 }}>{t.vehicle?.plateNumber}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>({t.vehicle?.make})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          <User size={13} color="#8b5cf6" />
                          <span>{t.driver?.user?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <div>Dep: {new Date(t.plannedDepartureTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        <div>Arr: {new Date(t.plannedArrivalTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={t.status} />
                      {t.delayReason && (
                        <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px', maxWidth: '180px' }}>
                          ⚠ {t.delayReason}
                        </div>
                      )}
                    </td>

                    <td>
                      {t.status !== 'Completed' && t.status !== 'Cancelled' ? (
                        <button
                          onClick={() => openStatusUpdater(t)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(14, 165, 233, 0.3)', color: '#38bdf8' }}
                        >
                          Update Status
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Archived</span>
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
          totalItems={filteredTrips.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Schedule Dispatch Modal */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title="Schedule New Dispatch Order">
        <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Origin Location *</label>
              <input
                type="text"
                required
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="e.g. Dallas Central Hub (TX)"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination Location *</label>
              <input
                type="text"
                required
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. Austin Regional Hub (TX)"
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated Distance (km) *</label>
              <input
                type="number"
                required
                value={formData.estimatedDistanceKm}
                onChange={(e) => setFormData({ ...formData, estimatedDistanceKm: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hub Branch</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="form-select"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Planned Departure Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.plannedDepartureTime}
                onChange={(e) => setFormData({ ...formData, plannedDepartureTime: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Planned Arrival Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.plannedArrivalTime}
                onChange={(e) => setFormData({ ...formData, plannedArrivalTime: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assign Vehicle Asset *</label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="form-select"
              >
                <option value="">Select available vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} — {v.make} {v.model} ({v.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assign Commercial Driver *</label>
              <select
                required
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="form-select"
              >
                <option value="">Select available driver...</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.user?.name} (Rating: {d.safetyRating}★ | {d.licenseClass})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cargo Manifest & Goods</label>
              <input
                type="text"
                value={formData.cargoDetails}
                onChange={(e) => setFormData({ ...formData, cargoDetails: e.target.value })}
                placeholder="e.g. Precision CNC Machined Components"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payload (kg)</label>
              <input
                type="number"
                value={formData.cargoWeightKg}
                onChange={(e) => setFormData({ ...formData, cargoWeightKg: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Verify Availability & Dispatch
            </button>
          </div>
        </form>
      </Modal>

      {/* Advance Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Update Trip Status: ${selectedTrip?.tripNumber}`}
      >
        <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">New Status State</label>
            <select
              value={statusUpdateData.status}
              onChange={(e) => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
              className="form-select"
            >
              <option value="Started">Started (In Transit)</option>
              <option value="Delayed">Delayed (Hold / Weather)</option>
              <option value="Completed">Completed (Signed Off)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Current Location / Waypoint</label>
            <input
              type="text"
              value={statusUpdateData.location}
              onChange={(e) => setStatusUpdateData({ ...statusUpdateData, location: e.target.value })}
              placeholder="e.g. Mile Marker 128, I-45 Southbound"
              className="form-input"
            />
          </div>

          {statusUpdateData.status === 'Delayed' && (
            <div className="form-group">
              <label className="form-label" style={{ color: '#fbbf24' }}>
                Delay Incident Reason *
              </label>
              <input
                type="text"
                required
                value={statusUpdateData.delayReason}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, delayReason: e.target.value })}
                placeholder="e.g. Interstate highway closure due to flash flood"
                className="form-input"
              />
            </div>
          )}

          {statusUpdateData.status === 'Completed' && (
            <div className="form-group">
              <label className="form-label">Final Destination Odometer (km)</label>
              <input
                type="number"
                value={statusUpdateData.odometer}
                onChange={(e) => setStatusUpdateData({ ...statusUpdateData, odometer: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Telemetry & Dispatch Log Notes</label>
            <textarea
              rows={3}
              value={statusUpdateData.notes}
              onChange={(e) => setStatusUpdateData({ ...statusUpdateData, notes: e.target.value })}
              placeholder="Provide context or driver check-in message..."
              className="form-textarea"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsStatusModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Status Transition
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TripsPage;
