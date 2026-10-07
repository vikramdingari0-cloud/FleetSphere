import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/common/CommandPalette';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import TripsPage from './pages/TripsPage';
import DriversPage from './pages/DriversPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import ExpensesPage from './pages/ExpensesPage';
import IncidentsPage from './pages/IncidentsPage';
import DocumentsPage from './pages/DocumentsPage';
import { getNavigationForRole } from './config/navigationConfig';

const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure activeTab is permitted for current role
  useEffect(() => {
    if (user?.role) {
      const allowed = getNavigationForRole(user.role).map((n) => n.id);
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080c14',
          color: '#fff',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="telemetry-live" />
          <span>Connecting to FleetSphere Telematics Core...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'vehicles':
        return <VehiclesPage />;
      case 'trips':
        return <TripsPage />;
      case 'drivers':
        return <DriversPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'fuel':
        return <FuelPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'documents':
        return <DocumentsPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-wrapper">
        <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} onNavigateTab={setActiveTab} />
        <main className="content-area">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        user={user}
      />
    </div>
  );
};

export default App;
