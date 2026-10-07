import React, { useState, useEffect, useRef } from 'react';
import { searchAPI } from '../../services/api';
import {
  Search,
  Truck,
  Navigation,
  Users,
  Wrench,
  Fuel,
  DollarSign,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, setActiveTab, user }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entityResults, setEntityResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setEntityResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live Debounced Entity Search across Vehicles, Drivers, Trips, Maintenance, Expenses
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setEntityResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchAPI.query(query.trim());
        const raw = res.data?.results || [];

        const mapped = raw.map(item => {
          let icon = Truck;
          if (item.type === 'Trip') icon = Navigation;
          else if (item.type === 'Driver') icon = Users;
          else if (item.type === 'Branch') icon = Building2;
          else if (item.type === 'Maintenance') icon = Wrench;
          else if (item.type === 'Expense') icon = DollarSign;
          else if (item.type === 'Incident') icon = AlertTriangle;

          return {
            id: `entity-${item.type}-${item.id}`,
            title: item.title,
            group: `${item.type} Record`,
            subtitle: item.subtitle,
            badge: item.badge,
            icon,
            action: () => {
              if (item.targetTab) setActiveTab(item.targetTab);
            }
          };
        });

        setEntityResults(mapped);
      } catch (err) {
        console.error('Global search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Static navigation and quick actions
  const systemCommands = [
    // Navigation
    { id: 'nav-dash', title: 'Open Dashboard', group: 'Navigation', icon: Navigation, action: () => setActiveTab('dashboard') },
    { id: 'nav-veh', title: 'View Fleet & Vehicles', group: 'Navigation', icon: Truck, action: () => setActiveTab('vehicles') },
    { id: 'nav-trips', title: 'View Trips & Dispatch', group: 'Navigation', icon: Navigation, action: () => setActiveTab('trips') },
    { id: 'nav-drivers', title: 'View Drivers Roster', group: 'Navigation', icon: Users, action: () => setActiveTab('drivers') },
    { id: 'nav-maint', title: 'View Maintenance Hub', group: 'Navigation', icon: Wrench, action: () => setActiveTab('maintenance') },
    { id: 'nav-fuel', title: 'View Fuel Telematics', group: 'Navigation', icon: Fuel, action: () => setActiveTab('fuel') },
    { id: 'nav-exp', title: 'View Expenses & Finance', group: 'Navigation', icon: DollarSign, action: () => setActiveTab('expenses') },
    { id: 'nav-inc', title: 'View Safety Incidents', group: 'Navigation', icon: AlertTriangle, action: () => setActiveTab('incidents') },
    { id: 'nav-doc', title: 'View Compliance Vault', group: 'Navigation', icon: FileText, action: () => setActiveTab('documents') },

    // Quick Actions
    { id: 'act-trip', title: 'Dispatch: Plan New Trip', group: 'Quick Actions', icon: Plus, action: () => setActiveTab('trips'), roleAllowed: ['Super Admin', 'Fleet Manager', 'Branch Manager'] },
    { id: 'act-fuel', title: 'Log Fuel Entry', group: 'Quick Actions', icon: Fuel, action: () => setActiveTab('fuel'), roleAllowed: ['Super Admin', 'Fleet Manager', 'Branch Manager', 'Driver'] },
    { id: 'act-exp', title: 'Submit Expense Claim', group: 'Quick Actions', icon: DollarSign, action: () => setActiveTab('expenses'), roleAllowed: ['Super Admin', 'Fleet Manager', 'Branch Manager', 'Driver', 'Finance Officer'] },
    { id: 'act-inc', title: 'Report Safety Incident', group: 'Quick Actions', icon: AlertTriangle, action: () => setActiveTab('incidents'), roleAllowed: ['Super Admin', 'Fleet Manager', 'Branch Manager', 'Driver'] },
    { id: 'act-maint', title: 'Create Work Order', group: 'Quick Actions', icon: Wrench, action: () => setActiveTab('maintenance'), roleAllowed: ['Super Admin', 'Fleet Manager', 'Branch Manager'] }
  ].filter(cmd => !cmd.roleAllowed || cmd.roleAllowed.includes(user?.role));

  const filteredCommands = systemCommands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.group.toLowerCase().includes(query.toLowerCase())
  );

  // Combine live entity results + filtered system commands
  const combinedList = [...entityResults, ...filteredCommands];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (combinedList.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedList.length) % (combinedList.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (combinedList[selectedIndex]) {
        combinedList[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Input Header */}
        <div className="cmd-header">
          <Search size={18} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Search vehicles, drivers, trips, expenses, commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {isSearching && (
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '6px' }}>
              Searching...
            </span>
          )}
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        {/* Command List */}
        <div className="cmd-list">
          {combinedList.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
              No fleet records or commands found matching "{query}"
            </div>
          ) : (
            combinedList.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="cmd-item-main">
                    <Icon size={16} />
                    <div>
                      <div>{item.title}</div>
                      {item.subtitle && (
                        <div
                          style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}
                          dangerouslySetInnerHTML={{ __html: item.subtitle }}
                        />
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.badge && (
                      <span className="badge badge-subtle" style={{ fontSize: '10px' }}>
                        {item.badge}
                      </span>
                    )}
                    <span className="cmd-item-sub">{item.group}</span>
                    <ArrowRight size={13} style={{ opacity: isSelected ? 1 : 0.3 }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="cmd-footer">
          <span>Navigate with <kbd className="cmd-kbd">↑</kbd> <kbd className="cmd-kbd">↓</kbd></span>
          <span>Execute with <kbd className="cmd-kbd">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
