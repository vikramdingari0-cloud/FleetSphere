import React, { useState, useEffect } from 'react';
import { fuelAPI, vehiclesAPI, driversAPI } from '../services/api';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Fuel,
  Plus,
  TrendingUp,
  DollarSign,
  Gauge,
  MapPin,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const FuelPage = () => {
  const { user, showToast } = useAuth();
  const [entries, setEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    odometerReading: 0,
    fuelVolumeLiters: 250,
    unitPrice: 1.15,
    fuelStation: 'Love’s Travel Stop',
    receiptNumber: '',
    isFullTank: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, vRes, dRes] = await Promise.all([
        fuelAPI.getAll(),
        vehiclesAPI.getAll(),
        driversAPI.getAll()
      ]);
      setEntries(fRes.data);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
      if (vRes.data.length > 0 && !formData.vehicleId) {
        setFormData((prev) => ({ ...prev, vehicleId: vRes.data[0]._id, odometerReading: vRes.data[0].currentOdometer }));
      }
      if (dRes.data.length > 0 && !formData.driverId) {
        setFormData((prev) => ({ ...prev, driverId: dRes.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load fuel records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFuel = async (e) => {
    e.preventDefault();
    try {
      await fuelAPI.create(formData);
      showToast('Fuel entry logged and telemetry updated!');
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to log fuel refill', 'error');
    }
  };

  const totalFuelCost = entries.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalVolume = entries.reduce((acc, curr) => acc + (curr.fuelVolumeLiters || 0), 0);
  const validEfficiencies = entries.filter((e) => e.calculatedEfficiencyKmPerL > 0);
  const avgEfficiency = validEfficiencies.length > 0
    ? (validEfficiencies.reduce((acc, curr) => acc + curr.calculatedEfficiencyKmPerL, 0) / validEfficiencies.length).toFixed(2)
    : '3.85';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Fuel Logistics & Telematics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
            Volume consumption, refueling receipts, per-liter cost, and automated km/L efficiency
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Log Fuel Refill
        </button>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 24px' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Recorded Fuel Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px' }}>Across fleet dispatches</div>
        </div>

        <div className="card" style={{ padding: '18px 24px' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Total Volume Dispensed</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            {totalVolume.toLocaleString()} L
          </div>
          <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '4px' }}>Diesel & Commercial Fuel</div>
        </div>

        <div className="card" style={{ padding: '18px 24px' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Fleet Avg Efficiency</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {avgEfficiency} km/L
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>Calculated from telemetry</div>
        </div>
      </div>

      {/* Fuel Entries Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date & Station</th>
                <th>Vehicle Asset</th>
                <th>Driver</th>
                <th>Odometer</th>
                <th>Volume (L)</th>
                <th>Unit Price</th>
                <th>Total Cost</th>
                <th>Efficiency (km/L)</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No fuel logs recorded yet.
                  </td>
                </tr>
              ) : (
                entries.map((f) => (
                  <tr key={f._id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {new Date(f.date).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                          {f.fuelStation || 'Commercial Refueling Point'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#38bdf8' }}>{f.vehicle?.plateNumber}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{f.vehicle?.make}</div>
                    </td>

                    <td>
                      <span style={{ fontSize: '13px', color: '#fff' }}>
                        {f.driver?.user?.name || 'Driver'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Gauge size={13} color="var(--text-dim)" />
                        <span style={{ fontWeight: 500, color: '#fff' }}>
                          {f.odometerReading?.toLocaleString()} km
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{f.fuelVolumeLiters} L</span>
                    </td>

                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>${f.unitPrice?.toFixed(2)}/L</span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>
                        ${f.totalCost?.toFixed(2)}
                      </span>
                    </td>

                    <td>
                      {f.calculatedEfficiencyKmPerL ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#34d399',
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <TrendingUp size={12} /> {f.calculatedEfficiencyKmPerL} km/L
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Baseline Fill</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Fuel Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Log Refueling Telemetry">
        <form onSubmit={handleCreateFuel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Vehicle Asset *</label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => {
                  const v = vehicles.find((x) => x._id === e.target.value);
                  setFormData({
                    ...formData,
                    vehicleId: e.target.value,
                    odometerReading: v?.currentOdometer || formData.odometerReading
                  });
                }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Odometer (km) *</label>
              <input
                type="number"
                required
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fuel Volume (L) *</label>
              <input
                type="number"
                required
                value={formData.fuelVolumeLiters}
                onChange={(e) => setFormData({ ...formData, fuelVolumeLiters: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unit Price ($/L) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fuel Station / Travel Stop</label>
              <input
                type="text"
                value={formData.fuelStation}
                onChange={(e) => setFormData({ ...formData, fuelStation: e.target.value })}
                placeholder="e.g. Love's Travel Stop #419 - Dallas"
                className="form-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Receipt / Slip #</label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="RCP-99120"
                className="form-input"
              />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(14, 165, 233, 0.08)',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid rgba(14, 165, 233, 0.2)'
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Computed Total Charge:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
              ${(formData.fuelVolumeLiters * formData.unitPrice).toFixed(2)}
            </span>
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Fuel Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FuelPage;
