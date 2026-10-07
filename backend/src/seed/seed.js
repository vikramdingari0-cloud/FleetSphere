const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');

const User = require('../models/User');
const Branch = require('../models/Branch');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const MaintenanceJob = require('../models/MaintenanceJob');
const FuelEntry = require('../models/FuelEntry');
const Expense = require('../models/Expense');
const Incident = require('../models/Incident');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Organization = require('../models/Organization');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('--- Commencing FleetSphere Data Seeding ---');
    
    // Drop old indexes and collections to avoid stale unique index collisions
    if (mongoose.connection.db) {
      try {
        await mongoose.connection.db.dropDatabase();
        console.log('[Seed] Dropped stale database collections & indexes.');
      } catch (dropErr) {
        console.warn('[Seed] Drop database note:', dropErr.message);
      }
    }

    // 0. Create Enterprise Organization
    const defaultOrg = await Organization.create({
      name: 'Sphere Global Logistics Corp',
      code: 'SPHERE-CORP',
      subscriptionPlan: 'Enterprise',
      status: 'Active',
      contactEmail: 'operations@fleetsphere.com',
      contactPhone: '+1 (800) 555-0100',
      address: '1000 Logistics Way, Suite 500, Dallas, TX 75201',
      settings: {
        currency: 'USD',
        distanceUnit: 'km',
        timezone: 'America/Chicago'
      }
    });
    console.log(`[Seed] Created primary enterprise tenant: ${defaultOrg.name} (${defaultOrg.code})`);

    // 1. Create Branches
    const branches = await Branch.create([
      {
        name: 'Dallas Central Logistics Hub',
        code: 'DAL-01',
        city: 'Dallas, TX',
        address: '8400 Logistics Pkwy, Dallas, TX 75261',
        contactPhone: '+1 (214) 555-0199',
        contactEmail: 'dallas.hub@fleetsphere.com',
        capacity: 75
      },
      {
        name: 'Chicago Freight Depot',
        code: 'CHI-02',
        city: 'Chicago, IL',
        address: '1420 O’Hare Cargo Rd, Des Plaines, IL 60018',
        contactPhone: '+1 (312) 555-0144',
        contactEmail: 'chicago.depot@fleetsphere.com',
        capacity: 60
      },
      {
        name: 'Atlanta Express Base',
        code: 'ATL-03',
        city: 'Atlanta, GA',
        address: '2200 Interstate Intermodal Way, Atlanta, GA 30337',
        contactPhone: '+1 (404) 555-0182',
        contactEmail: 'atlanta.base@fleetsphere.com',
        capacity: 50
      }
    ]);

    const [dallas, chicago, atlanta] = branches;
    console.log(`[Seed] Created ${branches.length} hub branches.`);

    // 2. Create Users
    const users = await User.create([
      {
        name: 'Marcus Sterling',
        email: 'admin@fleetsphere.com',
        password: 'password123',
        role: 'Super Admin',
        phone: '+1 (555) 000-0001',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Helena Vance',
        email: 'fleet@fleetsphere.com',
        password: 'password123',
        role: 'Fleet Manager',
        branch: dallas._id,
        phone: '+1 (555) 000-0002',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'David Kowalski',
        email: 'branch.dallas@fleetsphere.com',
        password: 'password123',
        role: 'Branch Manager',
        branch: dallas._id,
        phone: '+1 (555) 000-0003'
      },
      {
        name: 'Rachel Adams',
        email: 'finance@fleetsphere.com',
        password: 'password123',
        role: 'Finance Officer',
        phone: '+1 (555) 000-0004'
      },
      {
        name: 'John Miller',
        email: 'driver.john@fleetsphere.com',
        password: 'password123',
        role: 'Driver',
        branch: dallas._id,
        phone: '+1 (555) 111-2201'
      },
      {
        name: 'Sarah Connor',
        email: 'driver.sarah@fleetsphere.com',
        password: 'password123',
        role: 'Driver',
        branch: chicago._id,
        phone: '+1 (555) 111-2202'
      },
      {
        name: 'Marcus Bell',
        email: 'driver.marcus@fleetsphere.com',
        password: 'password123',
        role: 'Driver',
        branch: atlanta._id,
        phone: '+1 (555) 111-2203'
      },
      {
        name: 'Elena Rostova',
        email: 'driver.elena@fleetsphere.com',
        password: 'password123',
        role: 'Driver',
        branch: dallas._id,
        phone: '+1 (555) 111-2204'
      }
    ]);

    const [adminUser, fleetUser, branchUser, financeUser, driverUser1, driverUser2, driverUser3, driverUser4] = users;
    console.log(`[Seed] Created ${users.length} authenticated enterprise users.`);

    // 3. Create Vehicles
    const vehicles = await Vehicle.create([
      {
        vin: '1FT8W3BT9NED01991',
        plateNumber: 'TX-VOLVO-782',
        make: 'Volvo Trucks',
        model: 'VNL 860 Sleeper',
        year: 2023,
        type: 'Heavy Duty Truck',
        fuelType: 'Diesel',
        fuelCapacity: 450,
        currentOdometer: 64200,
        status: 'In Transit',
        branch: dallas._id,
        serviceIntervalKm: 15000,
        lastServiceOdometer: 55000,
        lastServiceDate: new Date('2024-06-10')
      },
      {
        vin: '1FTBR1C85PKA99214',
        plateNumber: 'TX-EV-104',
        make: 'Ford Commercial',
        model: 'E-Transit Cargo',
        year: 2024,
        type: 'Electric Van',
        fuelType: 'Electric',
        fuelCapacity: 68,
        currentOdometer: 14800,
        status: 'Available',
        branch: dallas._id,
        serviceIntervalKm: 10000,
        lastServiceOdometer: 10000,
        lastServiceDate: new Date('2024-07-02')
      },
      {
        vin: '3AKJHHDR5LSKL8812',
        plateNumber: 'IL-FREIGHT-99',
        make: 'Freightliner',
        model: 'Cascadia 126 Evolution',
        year: 2022,
        type: 'Heavy Duty Truck',
        fuelType: 'Diesel',
        fuelCapacity: 500,
        currentOdometer: 112000,
        status: 'Available',
        branch: chicago._id,
        serviceIntervalKm: 15000,
        lastServiceOdometer: 100000,
        lastServiceDate: new Date('2024-05-18')
      },
      {
        vin: 'WD3PF4CC2NP990234',
        plateNumber: 'IL-SPRINT-33',
        make: 'Mercedes-Benz',
        model: 'Sprinter 2500 High Roof',
        year: 2023,
        type: 'Delivery Van',
        fuelType: 'Diesel',
        fuelCapacity: 90,
        currentOdometer: 42100,
        status: 'Maintenance',
        branch: chicago._id,
        serviceIntervalKm: 12000,
        lastServiceOdometer: 30000,
        lastServiceDate: new Date('2024-04-12')
      },
      {
        vin: '1XP5D49X5KD440192',
        plateNumber: 'GA-SEMI-501',
        make: 'Peterbilt',
        model: 'Model 579 UltraLoft',
        year: 2023,
        type: 'Cargo Semi',
        fuelType: 'Diesel',
        fuelCapacity: 520,
        currentOdometer: 78500,
        status: 'Available',
        branch: atlanta._id,
        serviceIntervalKm: 15000,
        lastServiceOdometer: 70000,
        lastServiceDate: new Date('2024-06-25')
      },
      {
        vin: '1FT8W2BN8PEC33910',
        plateNumber: 'GA-FORD-404',
        make: 'Ford',
        model: 'F-250 Super Duty 4x4',
        year: 2023,
        type: 'Pickup 4x4',
        fuelType: 'Gasoline',
        fuelCapacity: 120,
        currentOdometer: 31000,
        status: 'Available',
        branch: atlanta._id,
        serviceIntervalKm: 10000,
        lastServiceOdometer: 25000,
        lastServiceDate: new Date('2024-07-15')
      },
      {
        vin: '1M2AX14C7PM339182',
        plateNumber: 'TX-MACK-201',
        make: 'Mack',
        model: 'Anthem 70 Stand-Up',
        year: 2021,
        type: 'Heavy Duty Truck',
        fuelType: 'Diesel',
        fuelCapacity: 480,
        currentOdometer: 185400,
        status: 'Out of Service',
        branch: dallas._id,
        serviceIntervalKm: 15000,
        lastServiceOdometer: 170000,
        lastServiceDate: new Date('2024-03-01'),
        isOverdueForService: true
      },
      {
        vin: '7PDSGABA4RN001922',
        plateNumber: 'IL-RIVIAN-12',
        make: 'Rivian',
        model: 'Commercial Delivery 700',
        year: 2024,
        type: 'Electric Van',
        fuelType: 'Electric',
        fuelCapacity: 100,
        currentOdometer: 9800,
        status: 'Available',
        branch: chicago._id,
        serviceIntervalKm: 15000,
        lastServiceOdometer: 0,
        lastServiceDate: new Date('2024-01-15')
      }
    ]);

    const [v1, v2, v3, v4, v5, v6, v7, v8] = vehicles;
    console.log(`[Seed] Created ${vehicles.length} commercial vehicles.`);

    // 4. Create Driver Profiles
    const drivers = await Driver.create([
      {
        user: driverUser1._id,
        licenseNumber: 'TX-CDL-883921A',
        licenseClass: 'Class A CDL (Double/Triple & HazMat)',
        licenseExpiryDate: new Date('2027-08-15'),
        medicalCertExpiryDate: new Date('2026-11-20'),
        drivingExperienceYears: 8,
        safetyRating: 4.92,
        status: 'On Duty',
        branch: dallas._id,
        assignedVehicle: v1._id,
        totalTripsCompleted: 142,
        totalDistanceDrivenKm: 88400
      },
      {
        user: driverUser2._id,
        licenseNumber: 'IL-CDL-449120B',
        licenseClass: 'Class A CDL (Commercial Semi)',
        licenseExpiryDate: new Date('2026-12-05'),
        medicalCertExpiryDate: new Date('2026-10-14'),
        drivingExperienceYears: 5,
        safetyRating: 4.85,
        status: 'Available',
        branch: chicago._id,
        assignedVehicle: v3._id,
        totalTripsCompleted: 98,
        totalDistanceDrivenKm: 56300
      },
      {
        user: driverUser3._id,
        licenseNumber: 'GA-CDL-991032C',
        licenseClass: 'Class A CDL (Tanker & Air Brakes)',
        licenseExpiryDate: new Date('2028-02-28'),
        medicalCertExpiryDate: new Date('2027-01-10'),
        drivingExperienceYears: 6,
        safetyRating: 4.78,
        status: 'Available',
        branch: atlanta._id,
        assignedVehicle: v5._id,
        totalTripsCompleted: 114,
        totalDistanceDrivenKm: 64200
      },
      {
        user: driverUser4._id,
        licenseNumber: 'TX-CDL-221944A',
        licenseClass: 'Class B CDL (Passenger & Delivery)',
        licenseExpiryDate: new Date('2027-04-18'),
        medicalCertExpiryDate: new Date('2026-09-30'),
        drivingExperienceYears: 10,
        safetyRating: 4.98,
        status: 'Available',
        branch: dallas._id,
        assignedVehicle: v2._id,
        totalTripsCompleted: 210,
        totalDistanceDrivenKm: 104500
      }
    ]);

    const [d1, d2, d3, d4] = drivers;
    console.log(`[Seed] Created ${drivers.length} commercial drivers.`);

    // 5. Create Trips
    const trips = await Trip.create([
      {
        tripNumber: 'TRP-2024-0801',
        origin: 'Dallas Central Hub (TX)',
        destination: 'Houston Intermodal Rail Port (TX)',
        estimatedDistanceKm: 385,
        actualDistanceKm: 390,
        plannedDepartureTime: new Date(Date.now() - 4 * 3600 * 1000),
        plannedArrivalTime: new Date(Date.now() + 2 * 3600 * 1000),
        actualDepartureTime: new Date(Date.now() - 3.8 * 3600 * 1000),
        vehicle: v1._id,
        driver: d1._id,
        branch: dallas._id,
        cargoDetails: 'Industrial Electronics & Sensor Modules',
        cargoWeightKg: 14200,
        status: 'Started',
        statusHistory: [
          { status: 'Planned', timestamp: new Date(Date.now() - 24 * 3600 * 1000), notes: 'Trip dispatched by Fleet Manager' },
          { status: 'Assigned', timestamp: new Date(Date.now() - 12 * 3600 * 1000), notes: 'Assigned to John Miller' },
          { status: 'Started', timestamp: new Date(Date.now() - 3.8 * 3600 * 1000), notes: 'Departed Dallas Hub via I-45 S', location: 'Corsicana, TX' }
        ],
        startOdometer: 63810
      },
      {
        tripNumber: 'TRP-2024-0802',
        origin: 'Chicago Freight Depot (IL)',
        destination: 'Detroit Logistics Center (MI)',
        estimatedDistanceKm: 450,
        plannedDepartureTime: new Date(Date.now() + 8 * 3600 * 1000),
        plannedArrivalTime: new Date(Date.now() + 15 * 3600 * 1000),
        vehicle: v3._id,
        driver: d2._id,
        branch: chicago._id,
        cargoDetails: 'Automotive Stamping Assembly Dies',
        cargoWeightKg: 18500,
        status: 'Assigned',
        statusHistory: [
          { status: 'Planned', timestamp: new Date(Date.now() - 18 * 3600 * 1000), notes: 'Dispatch scheduled' },
          { status: 'Assigned', timestamp: new Date(Date.now() - 2 * 3600 * 1000), notes: 'Assigned to Sarah Connor' }
        ]
      },
      {
        tripNumber: 'TRP-2024-0803',
        origin: 'Atlanta Express Base (GA)',
        destination: 'Savannah Deepwater Harbor (GA)',
        estimatedDistanceKm: 400,
        actualDistanceKm: 405,
        plannedDepartureTime: new Date(Date.now() - 48 * 3600 * 1000),
        plannedArrivalTime: new Date(Date.now() - 41 * 3600 * 1000),
        actualDepartureTime: new Date(Date.now() - 48 * 3600 * 1000),
        actualArrivalTime: new Date(Date.now() - 41.5 * 3600 * 1000),
        vehicle: v5._id,
        driver: d3._id,
        branch: atlanta._id,
        cargoDetails: 'Export Solar Panel Units',
        cargoWeightKg: 16800,
        status: 'Completed',
        startOdometer: 78095,
        endOdometer: 78500,
        statusHistory: [
          { status: 'Planned', timestamp: new Date(Date.now() - 55 * 3600 * 1000) },
          { status: 'Started', timestamp: new Date(Date.now() - 48 * 3600 * 1000) },
          { status: 'Completed', timestamp: new Date(Date.now() - 41.5 * 3600 * 1000), notes: 'Cargo received and signed off' }
        ]
      },
      {
        tripNumber: 'TRP-2024-0804',
        origin: 'Dallas Central Hub (TX)',
        destination: 'Oklahoma City Freight Terminal (OK)',
        estimatedDistanceKm: 330,
        plannedDepartureTime: new Date(Date.now() - 6 * 3600 * 1000),
        plannedArrivalTime: new Date(Date.now() - 1 * 3600 * 1000),
        actualDepartureTime: new Date(Date.now() - 5.5 * 3600 * 1000),
        vehicle: v2._id,
        driver: d4._id,
        branch: dallas._id,
        cargoDetails: 'Pharmaceutical Cold-Chain Supplies',
        cargoWeightKg: 3200,
        status: 'Delayed',
        delayReason: 'Severe weather delay on I-35 N (Ardmore area)',
        startOdometer: 14610,
        statusHistory: [
          { status: 'Planned', timestamp: new Date(Date.now() - 10 * 3600 * 1000) },
          { status: 'Started', timestamp: new Date(Date.now() - 5.5 * 3600 * 1000) },
          { status: 'Delayed', timestamp: new Date(Date.now() - 2 * 3600 * 1000), notes: 'Severe hail & highway closure' }
        ]
      }
    ]);

    console.log(`[Seed] Created ${trips.length} active and completed dispatch trips.`);

    // 6. Create Maintenance Jobs
    const maintenanceJobs = await MaintenanceJob.create([
      {
        jobNumber: 'MAINT-2024-001',
        vehicle: v4._id,
        branch: chicago._id,
        type: 'Scheduled Service',
        priority: 'High',
        status: 'In Progress',
        scheduledDate: new Date(),
        scheduledOdometer: 42100,
        estimatedCost: 1250,
        serviceProvider: 'Midwest Fleet Tech & Alignment',
        workDescription: 'Brake pad replacement, rotor machining, transmission fluid flush, and multi-point inspection.',
        partsReplaced: ['Front Brake Pads', 'Rotors OEM', 'Trans Filter'],
        performedBy: 'Lead Mechanic Jim S.'
      },
      {
        jobNumber: 'MAINT-2024-002',
        vehicle: v7._id,
        branch: dallas._id,
        type: 'Emergency Breakdown',
        priority: 'Critical',
        status: 'Scheduled',
        scheduledDate: new Date(Date.now() + 24 * 3600 * 1000),
        scheduledOdometer: 185400,
        estimatedCost: 3800,
        serviceProvider: 'Lone Star Diesel Heavy Repair',
        workDescription: 'Turbocharger actuator failure and DEF exhaust sensor malfunction. Overhaul required.',
        performedBy: 'Master Tech Ray B.'
      },
      {
        jobNumber: 'MAINT-2024-003',
        vehicle: v1._id,
        branch: dallas._id,
        type: 'Oil & Filter Change',
        priority: 'Medium',
        status: 'Completed',
        scheduledDate: new Date('2024-06-10'),
        completedDate: new Date('2024-06-10'),
        scheduledOdometer: 55000,
        completedOdometer: 55000,
        estimatedCost: 450,
        actualCost: 420,
        serviceProvider: 'Dallas QuickLube Fleet Services',
        workDescription: 'Standard synthetic 15W-40 oil swap, fuel water separator and oil filters changed.',
        partsReplaced: ['Engine Oil 15W-40 40L', 'Spin-on Filter']
      }
    ]);

    console.log(`[Seed] Created ${maintenanceJobs.length} maintenance work orders.`);

    // 7. Create Fuel Entries
    const fuelEntries = await FuelEntry.create([
      {
        vehicle: v1._id,
        driver: d1._id,
        branch: dallas._id,
        date: new Date(Date.now() - 3 * 3600 * 1000),
        odometerReading: 63810,
        fuelVolumeLiters: 280,
        unitPrice: 1.15,
        totalCost: 322.00,
        fuelStation: 'Love’s Travel Stop #419 - Dallas',
        isFullTank: true,
        receiptNumber: 'RCP-LV-99214',
        calculatedEfficiencyKmPerL: 3.85
      },
      {
        vehicle: v3._id,
        driver: d2._id,
        branch: chicago._id,
        date: new Date(Date.now() - 24 * 3600 * 1000),
        odometerReading: 111600,
        fuelVolumeLiters: 320,
        unitPrice: 1.18,
        totalCost: 377.60,
        fuelStation: 'Pilot Flying J - Gary, IN',
        isFullTank: true,
        receiptNumber: 'RCP-PF-88192',
        calculatedEfficiencyKmPerL: 3.92
      },
      {
        vehicle: v5._id,
        driver: d3._id,
        branch: atlanta._id,
        date: new Date(Date.now() - 48 * 3600 * 1000),
        odometerReading: 78095,
        fuelVolumeLiters: 295,
        unitPrice: 1.12,
        totalCost: 330.40,
        fuelStation: 'TA Express - Macon, GA',
        isFullTank: true,
        receiptNumber: 'RCP-TA-12093',
        calculatedEfficiencyKmPerL: 4.10
      }
    ]);

    console.log(`[Seed] Created ${fuelEntries.length} fuel refill entries.`);

    // 8. Create Expenses
    const expenses = await Expense.create([
      {
        title: 'I-45 Toll Expressway Pass',
        category: 'Toll Fees',
        amount: 38.50,
        date: new Date(Date.now() - 2 * 3600 * 1000),
        branch: dallas._id,
        vehicle: v1._id,
        driver: d1._id,
        status: 'Approved',
        approvedBy: financeUser._id,
        notes: 'Express lane toll during peak morning freight rush'
      },
      {
        title: 'O’Hare Cargo Terminal Secure Overnight Parking',
        category: 'Parking',
        amount: 65.00,
        date: new Date(Date.now() - 20 * 3600 * 1000),
        branch: chicago._id,
        vehicle: v3._id,
        driver: d2._id,
        status: 'Pending',
        notes: 'Staged awaiting customs clearance'
      },
      {
        title: 'Emergency Fan Belt Replacement on Route',
        category: 'Emergency Repair',
        amount: 240.00,
        date: new Date(Date.now() - 72 * 3600 * 1000),
        branch: atlanta._id,
        vehicle: v5._id,
        driver: d3._id,
        status: 'Approved',
        approvedBy: financeUser._id,
        notes: 'Mobile tech roadside fix to prevent stranding'
      },
      {
        title: 'Driver Meal & Per Diem (Interstate)',
        category: 'Driver Allowance',
        amount: 75.00,
        date: new Date(Date.now() - 5 * 3600 * 1000),
        branch: dallas._id,
        driver: d1._id,
        status: 'Pending',
        notes: 'Daily overnight stipend'
      }
    ]);

    console.log(`[Seed] Created ${expenses.length} operating expense entries.`);

    // 9. Create Incidents
    const incidents = await Incident.create([
      {
        incidentNumber: 'INC-2024-0001',
        vehicle: v7._id,
        driver: d4._id,
        branch: dallas._id,
        dateTime: new Date(Date.now() - 96 * 3600 * 1000),
        location: 'Bay 4, Dallas Central Hub',
        severity: 'Minor',
        description: 'Minor bumper scuff against docking bay bumper guard during low-speed reverse maneuver.',
        status: 'Under Investigation',
        estimatedLossAmount: 350,
        actionTaken: 'Inspected by safety officer. Vehicle cleared for local movement only.',
        insuranceClaimed: false
      }
    ]);

    console.log(`[Seed] Created ${incidents.length} safety incidents.`);

    // 10. Create Documents & Compliance
    const documents = await Document.create([
      {
        title: 'DOT Heavy Commercial Registration - Volvo VNL',
        documentType: 'Vehicle Registration',
        entityType: 'Vehicle',
        vehicle: v1._id,
        branch: dallas._id,
        fileUrl: 'https://fleetsphere.storage/docs/vnl860_reg_2025.pdf',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-12-31')
      },
      {
        title: 'Commercial Fleet Liability Policy #TX-882109',
        documentType: 'Vehicle Insurance',
        entityType: 'Organization',
        branch: dallas._id,
        fileUrl: 'https://fleetsphere.storage/docs/travelers_fleet_ins.pdf',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date(Date.now() + 20 * 24 * 3600 * 1000) // Expiring soon in 20 days!
      },
      {
        title: 'Commercial Interstate Transit Permit - Illinois',
        documentType: 'Road Permit',
        entityType: 'Vehicle',
        vehicle: v3._id,
        branch: chicago._id,
        fileUrl: 'https://fleetsphere.storage/docs/il_permit_cascadia.pdf',
        issueDate: new Date('2024-03-01'),
        expiryDate: new Date('2025-03-01')
      }
    ]);

    console.log(`[Seed] Created ${documents.length} regulatory compliance documents.`);

    // 11. Create Audit Logs
    await AuditLog.create([
      {
        action: 'SYSTEM_BOOT',
        userName: 'System Initialization',
        userRole: 'Super Admin',
        branch: dallas._id,
        details: 'FleetSphere core enterprise database successfully initialized and seeded.'
      },
      {
        action: 'TRIP_DISPATCHED',
        userName: 'Helena Vance',
        userRole: 'Fleet Manager',
        branch: dallas._id,
        details: 'Dispatched trip TRP-2024-0801 (Dallas to Houston) with driver John Miller'
      },
      {
        action: 'MAINTENANCE_SCHEDULED',
        userName: 'Helena Vance',
        userRole: 'Fleet Manager',
        branch: chicago._id,
        details: 'Scheduled job MAINT-2024-001 for vehicle IL-SPRINT-33'
      }
    ]);

    // Link all seeded records to the primary enterprise tenant
    await Promise.all([
      Branch.updateMany({}, { organization: defaultOrg._id }),
      User.updateMany({}, { organization: defaultOrg._id }),
      Vehicle.updateMany({}, { organization: defaultOrg._id }),
      Driver.updateMany({}, { organization: defaultOrg._id }),
      Trip.updateMany({}, { organization: defaultOrg._id }),
      MaintenanceJob.updateMany({}, { organization: defaultOrg._id }),
      FuelEntry.updateMany({}, { organization: defaultOrg._id }),
      Expense.updateMany({}, { organization: defaultOrg._id }),
      Incident.updateMany({}, { organization: defaultOrg._id }),
      Document.updateMany({}, { organization: defaultOrg._id }),
      AuditLog.updateMany({}, { organization: defaultOrg._id })
    ]);
    console.log('[Seed] Associated all entities with primary enterprise organization.');

    console.log('--- FleetSphere Database Seeding Completed Successfully! ---');
    return true;
  } catch (err) {
    console.error('[Seed Error]', err);
    throw err;
  }
};

// If run directly via node src/seed/seed.js
if (require.main === module) {
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
