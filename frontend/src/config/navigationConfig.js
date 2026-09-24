import {
  LayoutDashboard,
  Truck,
  Navigation,
  Users,
  Wrench,
  Fuel,
  DollarSign,
  AlertTriangle,
  FileText,
  Building2,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Sliders,
  User,
  Activity
} from 'lucide-react';

/**
 * Enterprise Role-Aware Navigation Configuration
 * Dynamically determines visible navigation modules, labels, and badges based on the user's role.
 */
export const getNavigationForRole = (role) => {
  switch (role) {
    case 'Super Admin':
      return [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, badge: 'Global' },
        { id: 'vehicles', label: 'Global Fleet', icon: Truck },
        { id: 'trips', label: 'All Dispatches', icon: Navigation },
        { id: 'drivers', label: 'Drivers Directory', icon: Users },
        { id: 'maintenance', label: 'Maintenance Hub', icon: Wrench },
        { id: 'fuel', label: 'Fuel Telematics', icon: Fuel },
        { id: 'expenses', label: 'Financial Audit', icon: DollarSign },
        { id: 'incidents', label: 'Safety & Incidents', icon: AlertTriangle },
        { id: 'documents', label: 'Compliance Vault', icon: FileText }
      ];

    case 'Fleet Manager':
      return [
        { id: 'dashboard', label: 'Fleet Command', icon: LayoutDashboard, badge: 'Live' },
        { id: 'vehicles', label: 'Fleet & Assets', icon: Truck },
        { id: 'trips', label: 'Trips & Dispatch', icon: Navigation },
        { id: 'drivers', label: 'Drivers Roster', icon: Users },
        { id: 'maintenance', label: 'Maintenance Center', icon: Wrench },
        { id: 'fuel', label: 'Fuel & Economy', icon: Fuel },
        { id: 'incidents', label: 'Safety Incidents', icon: AlertTriangle },
        { id: 'expenses', label: 'Operating Expenses', icon: DollarSign },
        { id: 'documents', label: 'Document Vault', icon: FileText }
      ];

    case 'Branch Manager':
      return [
        { id: 'dashboard', label: 'Branch Command', icon: LayoutDashboard, badge: 'Branch' },
        { id: 'vehicles', label: 'Branch Fleet', icon: Truck },
        { id: 'trips', label: 'Branch Trips', icon: Navigation },
        { id: 'drivers', label: 'Branch Drivers', icon: Users },
        { id: 'maintenance', label: 'Work Orders', icon: Wrench },
        { id: 'fuel', label: 'Branch Fueling', icon: Fuel },
        { id: 'incidents', label: 'Branch Safety', icon: AlertTriangle },
        { id: 'expenses', label: 'Branch Expenses', icon: DollarSign },
        { id: 'documents', label: 'Branch Vault', icon: FileText }
      ];

    case 'Driver':
      return [
        { id: 'dashboard', label: 'Driver Portal', icon: LayoutDashboard, badge: 'Active' },
        { id: 'trips', label: 'My Assigned Trips', icon: Navigation },
        { id: 'fuel', label: 'Fuel Log', icon: Fuel },
        { id: 'expenses', label: 'My Expenses', icon: DollarSign },
        { id: 'incidents', label: 'Report Incident', icon: AlertTriangle },
        { id: 'documents', label: 'My Documents', icon: FileText }
      ];

    case 'Finance Officer':
      return [
        { id: 'dashboard', label: 'Finance Command', icon: LayoutDashboard, badge: 'Ledger' },
        { id: 'expenses', label: 'Expense Approvals', icon: DollarSign },
        { id: 'fuel', label: 'Fuel Expenditure', icon: Fuel },
        { id: 'maintenance', label: 'Maintenance Costs', icon: Wrench },
        { id: 'trips', label: 'Trip Ledger', icon: Navigation },
        { id: 'documents', label: 'Financial Records', icon: FileText }
      ];

    default:
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'vehicles', label: 'Vehicles', icon: Truck },
        { id: 'trips', label: 'Trips', icon: Navigation }
      ];
  }
};
