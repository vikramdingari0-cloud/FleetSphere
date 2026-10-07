import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { tripsAPI } from '../../services/api';
import {
  Navigation,
  Truck,
  Fuel,
  DollarSign,
  AlertTriangle,
  FileText,
  Play,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Gauge,
  CheckCircle2,
  FileEdit
} from 'lucide-react';

const DriverDashboard = ({ data, user, setActiveTab, onRefresh, showToast }) => {
  const driverData = data?.roleContext?.driver || {};
  const currentTrip = driverData.currentTrip;
  const upcomingTrips = driverData.upcomingTrips || [];
  const [actionLoading, setActionLoading] = useState(false);

  // Complete Journey Modal state
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [endOdometerInput, setEndOdometerInput] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const handleStartTrip = async (tripId) => {
    try {
      setActionLoading(true);
      await tripsAPI.updateStatus(tripId, { status: 'Started' });
      showToast && showToast('Journey commenced! Drive safely and maintain speed limits.');
      onRefresh && onRefresh();
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Failed to start trip', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openCompleteModal = () => {
    if (!currentTrip) return;
    const estimatedEnd = (currentTrip.startOdometer || 0) + (currentTrip.estimatedDistanceKm || 100);
    setEndOdometerInput(String(estimatedEnd));
    setCompletionNotes('');
    setIsCompleteModalOpen(true);
  };

  const handleConfirmCompletion = async (e) => {
    e.preventDefault();
    if (!currentTrip) return;

    const numEndOdo = Number(endOdometerInput);
    if (isNaN(numEndOdo) || numEndOdo < (currentTrip.startOdometer || 0)) {
      showToast && showToast(`End odometer cannot be lower than start odometer (${currentTrip.startOdometer || 0} km)`, 'error');
      return;
    }

    try {
      setActionLoading(true);
      await tripsAPI.updateStatus(currentTrip._id, {
        status: 'Completed',
        endOdometer: numEndOdo,
        notes: completionNotes || 'Trip successfully completed and vehicle inspected by driver.'
      });
      showToast && showToast(`Trip ${currentTrip.tripNumber} completed! Logged ${numEndOdo - currentTrip.startOdometer} km.`);
      setIsCompleteModalOpen(false);
      onRefresh && onRefresh();
    } catch (err) {
      showToast && showToast(err.response?.data?.message || 'Failed to complete trip', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const startOdo = currentTrip?.startOdometer || 0;
  const currentDiff = Number(endOdometerInput) - startOdo;
  const isValidOdo = !isNaN(Number(endOdometerInput)) && Number(endOdometerInput) >= startOdo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Driver Welcome Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="role-badge driver">
            Driver Operations Portal
          </span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
            Welcome, {user?.name || 'Driver'}
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>
            {driverData.profile?.branch?.name || 'Assigned Logistics Hub'} &bull; License: {driverData.profile?.licenseNumber || 'Active'}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>{driverData.safetyScore || 4.8} Safety Rating</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            {driverData.completedTrips || 0} completed trips ({driverData.totalDistanceKm || 0} km)
          </span>
        </div>
      </div>

      {/* Primary Focal Area: MY CURRENT TRIP */}
      <div className="driver-focal-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} color="#0ea5e9" />
            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#38bdf8' }}>
              My Current Dispatch
            </span>
          </div>
          {currentTrip && (
            <span className={`status-badge status-${currentTrip.status?.toLowerCase()}`}>
              {currentTrip.status}
            </span>
          )}
        </div>

        {currentTrip ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                {currentTrip.tripNumber}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <Truck size={15} color="#0ea5e9" />
                <span>{currentTrip.vehicle?.plateNumber} &bull; {currentTrip.vehicle?.make} {currentTrip.vehicle?.model}</span>
              </div>
            </div>

            {/* Route Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                  <MapPin size={13} color="#10b981" /> Origin Hub
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                  {currentTrip.origin}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                  <MapPin size={13} color="#ef4444" /> Destination
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                  {currentTrip.destination}
                </div>
              </div>
            </div>

            {/* Trip Metas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Start Odometer:</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  {(currentTrip.startOdometer || 0).toLocaleString()} km
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Est. Distance:</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                  {currentTrip.estimatedDistanceKm} km
                </div>
              </div>
              {currentTrip.cargoDetails && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Cargo Weight:</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    {currentTrip.cargoWeightKg || 0} kg
                  </div>
                </div>
              )}
            </div>

            {/* Touch Action Buttons for Current Trip */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {currentTrip.status === 'Assigned' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleStartTrip(currentTrip._id)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700 }}
                >
                  <Play size={16} /> Start Journey
                </button>
              )}

              {currentTrip.status === 'Started' && (
                <button
                  disabled={actionLoading}
                  onClick={openCompleteModal}
                  className="btn"
                  style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, backgroundColor: '#10b981', color: '#fff' }}
                >
                  <CheckCircle size={16} /> Complete Journey &amp; Handover
                </button>
              )}

              {currentTrip.status === 'Delayed' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleStartTrip(currentTrip._id)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700 }}
                >
                  Resume Trip
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
              No Active Dispatches In Progress
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '12.5px', marginTop: '4px' }}>
              You are currently on standby. Review upcoming dispatches or perform quick logging below.
            </p>
          </div>
        )}
      </div>

      {/* Driver Rapid Actions Grid */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-dim)', marginBottom: '8px' }}>
          Driver Quick Logging Actions
        </h3>
        <div className="driver-action-grid">
          <button onClick={() => setActiveTab('fuel')} className="driver-touch-btn">
            <Fuel size={22} color="#0ea5e9" />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Log Fuel</span>
          </button>

          <button onClick={() => setActiveTab('expenses')} className="driver-touch-btn">
            <DollarSign size={22} color="#10b981" />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Log Expense</span>
          </button>

          <button onClick={() => setActiveTab('incidents')} className="driver-touch-btn">
            <AlertTriangle size={22} color="#f59e0b" />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Report Incident</span>
          </button>

          <button onClick={() => setActiveTab('documents')} className="driver-touch-btn">
            <FileText size={22} color="#8b5cf6" />
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>My Credentials</span>
          </button>
        </div>
      </div>

      {/* Upcoming Assigned Trips */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Upcoming Scheduled Dispatches</h3>
          <button onClick={() => setActiveTab('trips')} className="btn btn-secondary btn-sm">
            View All Trips
          </button>
        </div>

        {upcomingTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '13px' }}>
            No upcoming planned dispatches assigned.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingTrips.map((t) => (
              <div
                key={t._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '13.5px' }}>
                    {t.tripNumber} &bull; {t.origin} &rarr; {t.destination}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '11.5px', marginTop: '2px' }}>
                    Vehicle: {t.vehicle?.plateNumber} &bull; Departs: {new Date(t.plannedDepartureTime).toLocaleDateString()}
                  </div>
                </div>
                <span className="badge badge-subtle">{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* End Journey Handover Modal with Strict Odometer Validation */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Dispatch Handover: ${currentTrip?.tripNumber}`}
      >
        <form onSubmit={handleConfirmCompletion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '12.5px' }}>
            <div style={{ color: 'var(--text-muted)' }}>
              Vehicle: <strong style={{ color: '#fff' }}>{currentTrip?.vehicle?.plateNumber}</strong>
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Route Departure Odometer: <strong style={{ color: '#38bdf8' }}>{startOdo.toLocaleString()} km</strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Final Vehicle Odometer Reading (km) *</label>
            <div style={{ position: 'relative' }}>
              <Gauge size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="number"
                required
                className="form-input"
                style={{ paddingLeft: '38px' }}
                value={endOdometerInput}
                onChange={(e) => setEndOdometerInput(e.target.value)}
                min={startOdo}
                placeholder={`Must be >= ${startOdo}`}
              />
            </div>
            {!isValidOdo && (
              <span style={{ fontSize: '11.5px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                End odometer cannot be lower than departure odometer ({startOdo.toLocaleString()} km).
              </span>
            )}
            {isValidOdo && currentDiff >= 0 && (
              <span style={{ fontSize: '11.5px', color: '#10b981', marginTop: '4px', display: 'block' }}>
                Distance Logged: +{currentDiff.toLocaleString()} km
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Trip Notes &amp; Handover Condition</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Fuel station stop, road condition, payload delivery note..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !isValidOdo}
              className="btn"
              style={{ backgroundColor: '#10b981', color: '#fff', fontWeight: 700 }}
            >
              {actionLoading ? 'Finalizing...' : 'Confirm Journey Completion'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DriverDashboard;
