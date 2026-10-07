import React, { useState, useMemo } from 'react';
import {
  Truck,
  Navigation,
  MapPin,
  Compass,
  BatteryCharging,
  Fuel,
  Gauge,
  User,
  Radio,
  Maximize2,
  Filter,
  Eye,
  Activity,
  Layers
} from 'lucide-react';

// Hub and City Geo-Spatial Reference Anchors (Normalized SVG Coordinate System 900x520)
const LOGISTICS_NODES = {
  'Dallas, TX': { x: 360, y: 350, name: 'Dallas Logistics Hub', code: 'DAL-01', hub: true },
  'Dallas Hub': { x: 360, y: 350, name: 'Dallas Logistics Hub', code: 'DAL-01', hub: true },
  'Dallas': { x: 360, y: 350, name: 'Dallas Logistics Hub', code: 'DAL-01', hub: true },

  'Chicago, IL': { x: 570, y: 155, name: 'Chicago Freight Depot', code: 'CHI-02', hub: true },
  'Chicago Depot': { x: 570, y: 155, name: 'Chicago Freight Depot', code: 'CHI-02', hub: true },
  'Chicago': { x: 570, y: 155, name: 'Chicago Freight Depot', code: 'CHI-02', hub: true },

  'Atlanta, GA': { x: 685, y: 320, name: 'Atlanta Express Base', code: 'ATL-03', hub: true },
  'Atlanta Base': { x: 685, y: 320, name: 'Atlanta Express Base', code: 'ATL-03', hub: true },
  'Atlanta': { x: 685, y: 320, name: 'Atlanta Express Base', code: 'ATL-03', hub: true },

  'Houston, TX': { x: 380, y: 425, name: 'Houston Terminal', code: 'HOU', hub: false },
  'Houston': { x: 380, y: 425, name: 'Houston Terminal', code: 'HOU', hub: false },

  'Oklahoma City, OK': { x: 355, y: 265, name: 'OKC Depot', code: 'OKC', hub: false },
  'Oklahoma City': { x: 355, y: 265, name: 'OKC Depot', code: 'OKC', hub: false },

  'St. Louis, MO': { x: 515, y: 235, name: 'St. Louis Waypoint', code: 'STL', hub: false },
  'St. Louis': { x: 515, y: 235, name: 'St. Louis Waypoint', code: 'STL', hub: false },

  'Memphis, TN': { x: 510, y: 305, name: 'Memphis Air Cargo Hub', code: 'MEM', hub: false },
  'Memphis': { x: 510, y: 305, name: 'Memphis Air Cargo Hub', code: 'MEM', hub: false },

  'Nashville, TN': { x: 585, y: 275, name: 'Nashville Transit Hub', code: 'BNA', hub: false },
  'Nashville': { x: 585, y: 275, name: 'Nashville Transit Hub', code: 'BNA', hub: false },

  'Indianapolis, IN': { x: 605, y: 195, name: 'Indy Corridor', code: 'IND', hub: false },
  'Indianapolis': { x: 605, y: 195, name: 'Indy Corridor', code: 'IND', hub: false },

  'Kansas City, MO': { x: 425, y: 215, name: 'KC Distribution Point', code: 'MCI', hub: false },
  'Kansas City': { x: 425, y: 215, name: 'KC Distribution Point', code: 'MCI', hub: false },

  'New Orleans, LA': { x: 520, y: 430, name: 'New Orleans Port', code: 'MSY', hub: false },
  'New Orleans': { x: 520, y: 430, name: 'New Orleans Port', code: 'MSY', hub: false }
};

// Hub Corridors
const MAIN_CORRIDORS = [
  { from: 'Dallas, TX', to: 'Chicago, IL', mid: { x: 480, y: 240 } },
  { from: 'Dallas, TX', to: 'Atlanta, GA', mid: { x: 515, y: 335 } },
  { from: 'Chicago, IL', to: 'Atlanta, GA', mid: { x: 630, y: 240 } },
  { from: 'Dallas, TX', to: 'Houston, TX' },
  { from: 'Dallas, TX', to: 'Oklahoma City, OK' },
  { from: 'Chicago, IL', to: 'St. Louis, MO' }
];

// High-fidelity SVG vehicle silhouettes (distinguishable types)
const VehicleSilhouette = ({ type, color = '#38bdf8' }) => {
  if (type === 'Heavy Duty Truck' || type === 'Cargo Semi') {
    return (
      <g transform="translate(-16, -10) scale(0.9)">
        {/* Semi Trailer */}
        <rect x="0" y="3" width="22" height="13" rx="2" fill={color} opacity="0.9" />
        <rect x="2" y="5" width="18" height="9" fill="#080c14" opacity="0.4" />
        {/* Cab */}
        <path d="M 23 7 L 30 7 L 33 11 L 33 16 L 23 16 Z" fill={color} />
        {/* Cab Windshield */}
        <path d="M 28 8 L 31 11 L 28 11 Z" fill="#e0f2fe" opacity="0.8" />
        {/* Wheels */}
        <circle cx="5" cy="17" r="2.2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="10" cy="17" r="2.2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="27" cy="17" r="2.2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="31" cy="17" r="2.2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
      </g>
    );
  }

  if (type === 'Electric Van' || type === 'Delivery Van') {
    return (
      <g transform="translate(-14, -9) scale(0.9)">
        {/* Van Body */}
        <path d="M 2 5 L 18 5 L 24 10 L 26 13 L 26 16 L 2 16 Z" fill={color} rx="2" />
        {/* Van Windshield & Front Window */}
        <path d="M 17 6 L 22 10 L 17 10 Z" fill="#e0f2fe" opacity="0.85" />
        <rect x="11" y="6" width="4" height="4" fill="#e0f2fe" opacity="0.75" />
        {/* Electric Bolt Icon if Electric */}
        {type === 'Electric Van' && (
          <path d="M 7 7 L 5 11 L 8 11 L 6 15" stroke="#fbbf24" strokeWidth="1.2" fill="none" />
        )}
        {/* Wheels */}
        <circle cx="6" cy="17" r="2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="21" cy="17" r="2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
      </g>
    );
  }

  // Sedan / Utility Pickup
  return (
    <g transform="translate(-12, -8) scale(0.85)">
      {/* Car Body */}
      <path d="M 2 9 L 6 9 L 10 5 L 18 5 L 22 9 L 26 9 L 26 14 L 2 14 Z" fill={color} />
      {/* Windows */}
      <path d="M 10 6 L 13 6 L 13 9 L 8 9 Z" fill="#e0f2fe" opacity="0.85" />
      <path d="M 15 6 L 18 6 L 21 9 L 15 9 Z" fill="#e0f2fe" opacity="0.85" />
      {/* Wheels */}
      <circle cx="7" cy="15" r="2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
      <circle cx="21" cy="15" r="2" fill="#080c14" stroke="#94a3b8" strokeWidth="0.8" />
    </g>
  );
};

const FleetMap = ({
  vehicles = [],
  trips = [],
  branches = [],
  onSelectVehicle = null,
  height = 480,
  showTelemetryPanel = true
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showHubRadii, setShowHubRadii] = useState(true);

  // Map trips to vehicles for fast route lookup
  const activeTripsMap = useMemo(() => {
    const map = {};
    trips.forEach(t => {
      const vId = t.vehicle?._id || t.vehicle;
      if (vId && ['Started', 'Assigned', 'Delayed'].includes(t.status)) {
        map[vId] = t;
      }
    });
    return map;
  }, [trips]);

  // Derive coordinates for vehicles based on branch or active trip route
  const vehiclePlots = useMemo(() => {
    return vehicles.map((v, index) => {
      const activeTrip = activeTripsMap[v._id];
      let x = 360;
      let y = 350;
      let isLiveEnRoute = false;
      let progress = 0;
      let routePath = null;

      if (activeTrip) {
        const originCoord = LOGISTICS_NODES[activeTrip.origin] || LOGISTICS_NODES['Dallas, TX'];
        const destCoord = LOGISTICS_NODES[activeTrip.destination] || LOGISTICS_NODES['Chicago, IL'];

        routePath = {
          from: originCoord,
          to: destCoord,
          tripNumber: activeTrip.tripNumber,
          status: activeTrip.status
        };

        if (activeTrip.status === 'Started' || activeTrip.status === 'Delayed') {
          isLiveEnRoute = true;
          // Calculate deterministic progress position along route
          const tripTime = activeTrip.plannedDepartureTime ? new Date(activeTrip.plannedDepartureTime).getTime() : Date.now();
          const elapsed = (Date.now() - tripTime) / (1000 * 3600);
          progress = Math.min(Math.max((elapsed / 8) % 1, 0.25), 0.85); // Realistic position on corridor

          // Interpolate coordinate
          x = Math.round(originCoord.x + (destCoord.x - originCoord.x) * progress);
          y = Math.round(originCoord.y + (destCoord.y - originCoord.y) * progress);
        } else {
          // Planned / Assigned: located at origin hub
          x = originCoord.x + ((index % 3) * 14 - 14);
          y = originCoord.y + ((index % 2) * 14 - 7);
        }
      } else {
        // Vehicle stationed at branch
        const branchName = v.branch?.name || v.branch?.city || 'Dallas, TX';
        const node = Object.values(LOGISTICS_NODES).find(n => branchName.includes(n.code) || branchName.includes(n.name.split(' ')[0])) || LOGISTICS_NODES['Dallas, TX'];
        x = node.x + ((index % 4) * 16 - 24);
        y = node.y + ((index % 3) * 14 - 14);
      }

      return {
        ...v,
        x,
        y,
        isLiveEnRoute,
        progress: Math.round(progress * 100),
        routePath,
        activeTrip
      };
    });
  }, [vehicles, activeTripsMap]);

  // Filter plotted vehicles
  const filteredPlots = useMemo(() => {
    if (statusFilter === 'ALL') return vehiclePlots;
    return vehiclePlots.filter(p => p.status === statusFilter);
  }, [vehiclePlots, statusFilter]);

  const selectedPlot = useMemo(() => {
    return vehiclePlots.find(p => p._id === selectedVehicleId) || null;
  }, [vehiclePlots, selectedVehicleId]);

  const handleMarkerClick = (plot) => {
    setSelectedVehicleId(plot._id);
    if (onSelectVehicle) onSelectVehicle(plot);
  };

  return (
    <div className="fleet-map-container" style={{ position: 'relative', width: '100%', height: `${height}px` }}>
      {/* Map Control Bar */}
      <div className="fleet-map-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Compass size={17} color="#0ea5e9" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            INTERSTATE CORRIDOR TELEMATICS &bull; LIVE FLEET RADAR
          </span>
          <span className="badge badge-subtle" style={{ fontSize: '10.5px' }}>
            {filteredPlots.length} Vehicles Plotted
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            {['ALL', 'In Transit', 'Available', 'Maintenance'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  border: 'none',
                  background: statusFilter === st ? 'var(--primary)' : 'transparent',
                  color: statusFilter === st ? '#fff' : 'var(--text-dim)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHubRadii(prev => !prev)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            title="Toggle Hub Logistics Radii"
          >
            <Layers size={13} /> Hub Radii
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="fleet-map-body" style={{ width: '100%', height: `calc(${height}px - 48px)`, overflow: 'hidden' }}>
        <svg
          viewBox="0 0 900 500"
          style={{ width: '100%', height: '100%', background: '#070b14', userSelect: 'none' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="fleetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
            </pattern>

            {/* Glowing route filter */}
            <filter id="glowRoute" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Pulsing Marker filter */}
            <filter id="markerPulse" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Telematics Grid */}
          <rect width="900" height="500" fill="url(#fleetGrid)" />

          {/* Radar Horizon Rings */}
          <circle cx="450" cy="270" r="160" fill="none" stroke="rgba(14, 165, 233, 0.05)" strokeDasharray="3 3" />
          <circle cx="450" cy="270" r="300" fill="none" stroke="rgba(14, 165, 233, 0.03)" strokeDasharray="4 4" />

          {/* Hub Logistics Radii */}
          {showHubRadii && Object.values(LOGISTICS_NODES).filter(n => n.hub).map(hub => (
            <g key={`hub-rad-${hub.code}`}>
              <circle cx={hub.x} cy={hub.y} r="65" fill="rgba(14, 165, 233, 0.03)" stroke="rgba(14, 165, 233, 0.15)" strokeDasharray="2 3" />
              <circle cx={hub.x} cy={hub.y} r="120" fill="none" stroke="rgba(14, 165, 233, 0.07)" strokeDasharray="3 5" />
            </g>
          ))}

          {/* Interstate Highway Corridors */}
          {MAIN_CORRIDORS.map((corr, idx) => {
            const start = LOGISTICS_NODES[corr.from];
            const end = LOGISTICS_NODES[corr.to];
            if (!start || !end) return null;
            const pathD = corr.mid
              ? `M ${start.x} ${start.y} Q ${corr.mid.x} ${corr.mid.y} ${end.x} ${end.y}`
              : `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

            return (
              <path
                key={`corr-${idx}`}
                d={pathD}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Active Live Routes Plotted from Trips */}
          {filteredPlots.filter(p => p.routePath).map(p => {
            const { from, to, status } = p.routePath;
            const isSelected = selectedVehicleId === p._id;
            const isLive = p.isLiveEnRoute;

            return (
              <g key={`live-route-${p._id}`}>
                {/* Glow underlay */}
                <path
                  d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  fill="none"
                  stroke={isLive ? (isSelected ? '#38bdf8' : '#0ea5e9') : '#475569'}
                  strokeWidth={isSelected ? 4 : (isLive ? 2.5 : 1.5)}
                  opacity={isLive ? (isSelected ? 0.9 : 0.6) : 0.3}
                  strokeDasharray={isLive ? 'none' : '5 5'}
                  filter={isLive ? 'url(#glowRoute)' : undefined}
                />
              </g>
            );
          })}

          {/* Hub Depots & City Nodes */}
          {Object.entries(LOGISTICS_NODES).filter(([k, n]) => n.hub).map(([cityName, node]) => (
            <g key={`hub-node-${node.code}`} transform={`translate(${node.x}, ${node.y})`}>
              <circle r="9" fill="#0c1220" stroke="#0ea5e9" strokeWidth="2" />
              <circle r="4" fill="#38bdf8" />
              {/* Hub Label */}
              <text
                x="14"
                y="4"
                fill="#f8fafc"
                fontSize="11.5"
                fontWeight="700"
                letterSpacing="0.02em"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {node.name}
              </text>
              <text
                x="14"
                y="16"
                fill="#94a3b8"
                fontSize="9.5"
                fontFamily="var(--font-mono)"
              >
                [{node.code}] Hub
              </text>
            </g>
          ))}

          {/* Secondary Waypoint Cities */}
          {Object.entries(LOGISTICS_NODES).filter(([k, n]) => !n.hub && ['Houston', 'Memphis', 'St. Louis', 'Nashville'].includes(k)).map(([cityName, node]) => (
            <g key={`city-node-${node.code}`} transform={`translate(${node.x}, ${node.y})`}>
              <circle r="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <text x="8" y="3" fill="#64748b" fontSize="9" fontWeight="600">
                {cityName}
              </text>
            </g>
          ))}

          {/* Vehicle Markers Plotted on Map */}
          {filteredPlots.map((plot) => {
            const isSelected = selectedVehicleId === plot._id;
            const statusColor = plot.status === 'In Transit'
              ? '#06b6d4'
              : plot.status === 'Available'
              ? '#10b981'
              : plot.status === 'Maintenance'
              ? '#f59e0b'
              : '#ef4444';

            return (
              <g
                key={`veh-marker-${plot._id}`}
                transform={`translate(${plot.x}, ${plot.y})`}
                onClick={() => handleMarkerClick(plot)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
              >
                {/* Pulsing ring if In Transit */}
                {plot.isLiveEnRoute && (
                  <circle
                    r="18"
                    fill="none"
                    stroke={statusColor}
                    strokeWidth="1.2"
                    opacity="0.6"
                    style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                  />
                )}

                {/* Selected Halo */}
                {isSelected && (
                  <circle
                    r="22"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Vehicle Marker Background Plate */}
                <rect
                  x="-18"
                  y="-14"
                  width="36"
                  height="26"
                  rx="6"
                  fill="#0c1220"
                  stroke={isSelected ? '#38bdf8' : statusColor}
                  strokeWidth={isSelected ? '2' : '1.2'}
                  filter={plot.isLiveEnRoute ? 'url(#markerPulse)' : undefined}
                />

                {/* Vehicle Vector Graphic */}
                <VehicleSilhouette type={plot.type} color={statusColor} />

                {/* Plate Tag Label */}
                <g transform="translate(0, 21)">
                  <rect
                    x="-24"
                    y="-6"
                    width="48"
                    height="12"
                    rx="3"
                    fill="rgba(12, 18, 32, 0.9)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.6"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="8.5"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                  >
                    {plot.plateNumber.split('-').slice(-1)[0] || plot.plateNumber.substring(0, 6)}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Vehicle Telematics Popover Overlay */}
        {selectedPlot && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '320px',
              background: 'rgba(15, 22, 35, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              boxShadow: 'var(--shadow-float)',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedPlot.status === 'In Transit' ? '#06b6d4' : '#10b981' }} />
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                  {selectedPlot.plateNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedVehicleId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {selectedPlot.year} {selectedPlot.make} {selectedPlot.model} &bull; <strong style={{ color: '#fff' }}>{selectedPlot.type}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>Odometer</span>
                <strong style={{ color: '#fff' }}>{selectedPlot.currentOdometer.toLocaleString()} km</strong>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>Fuel / Power</span>
                <strong style={{ color: '#fff' }}>{selectedPlot.fuelType} ({selectedPlot.fuelCapacity} {selectedPlot.fuelType === 'Electric' ? 'kWh' : 'L'})</strong>
              </div>
            </div>

            {selectedPlot.activeTrip ? (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>Dispatch {selectedPlot.activeTrip.tripNumber}</span>
                  <span className="badge badge-subtle">{selectedPlot.activeTrip.status}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {selectedPlot.activeTrip.origin} &rarr; {selectedPlot.activeTrip.destination}
                </div>
                {selectedPlot.isLiveEnRoute && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-dim)', marginBottom: '3px' }}>
                      <span>En Route Progress</span>
                      <span>{selectedPlot.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedPlot.progress}%`, height: '100%', background: '#06b6d4', borderRadius: '3px' }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                Stationed at: <strong style={{ color: '#fff' }}>{selectedPlot.branch?.name || 'Hub Depot'}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetMap;
