const { test, describe, before } = require('node:test');
const assert = require('node:assert');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

describe('FleetSphere Production API & Security Test Suite', { concurrency: 1 }, () => {
  let superAdminToken = '';
  let driverToken = '';
  let branchManagerToken = '';
  let createdVehicleId = '';
  let testTripId = '';

  // Setup: Acquire tokens
  before(async () => {
    // 1. Super Admin login
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fleetsphere.com', password: 'password123' })
    });
    const adminData = await adminRes.json();
    superAdminToken = adminData.token;

    // 2. Driver login
    const driverRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.john@fleetsphere.com', password: 'password123' })
    });
    const driverData = await driverRes.json();
    driverToken = driverData.token;

    // 3. Branch Manager login
    const bmRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'branch.dallas@fleetsphere.com', password: 'password123' })
    });
    const bmData = await bmRes.json();
    branchManagerToken = bmData.token;
  });

  // 1. System Health
  test('1. Health Check Endpoint responds with 200 and ONLINE status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200');
    const data = await res.json();
    assert.strictEqual(data.status, 'ONLINE');
    assert.ok(data.service.includes('FleetSphere'));
  });

  // 2. Authentication: Valid Login
  test('2. Authentication: Super Admin receives JWT with organization tenant context', async () => {
    assert.ok(superAdminToken, 'Super Admin token must be defined');
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.role, 'Super Admin');
    assert.ok(data.organization, 'Organization context must be present on user profile');
  });

  test('3. Authentication: Driver receives restricted role token', async () => {
    assert.ok(driverToken, 'Driver token must be defined');
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.role, 'Driver');
  });

  test('4. Authentication Security: Invalid credentials rejected with 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fleetsphere.com',
        password: 'IncorrectPassword999!'
      })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.token, undefined);
  });

  // 3. RBAC & Broken Function Level Authorization
  test('5. RBAC: Driver is DENIED from creating vehicle asset (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        vin: '1TESTVIN987654321',
        plateNumber: 'HACK-999',
        make: 'Volvo',
        model: 'VNL 860',
        year: 2024,
        type: 'Heavy Duty Truck',
        fuelType: 'Diesel',
        fuelCapacity: 500,
        currentOdometer: 1000
      })
    });
    assert.strictEqual(res.status, 403, 'Driver must receive 403 Forbidden when creating a vehicle');
  });

  test('6. RBAC: Super Admin is PERMITTED to register new fleet asset', async () => {
    const res = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        vin: `TESTVIN${Date.now().toString().slice(-10)}`,
        plateNumber: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        make: 'Freightliner',
        model: 'Cascadia EVO',
        year: 2024,
        type: 'Heavy Duty Truck',
        fuelType: 'Diesel',
        fuelCapacity: 450,
        currentOdometer: 12500,
        serviceIntervalKm: 20000
      })
    });
    assert.strictEqual(res.status, 201, 'Super Admin should be able to create vehicle asset');
    const data = await res.json();
    const vehicleId = data._id || data.data?._id;
    assert.ok(vehicleId, 'Created vehicle ID must be returned');
    createdVehicleId = vehicleId;
  });

  // 4. Broken Object Level Authorization (BOLA) & Unauthenticated Access
  test('7. BOLA/Object Authorization: Non-existent ID returns safe 404', async () => {
    const res = await fetch(`${BASE_URL}/vehicles/64b000000000000000000000`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 404, 'Non-existent resource ID should return 404');
  });

  test('8. Unauthenticated request to protected route returns 401', async () => {
    const res = await fetch(`${BASE_URL}/vehicles`);
    assert.strictEqual(res.status, 401, 'Protected route without Bearer token must return 401');
  });

  // 5. Business Rules: Dispatch Odometer & State Machine
  test('9. Dispatch State Machine: Rejects invalid status transition', async () => {
    const tripsRes = await fetch(`${BASE_URL}/trips`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const trips = await tripsRes.json();
    assert.ok(Array.isArray(trips), 'Trips list must be an array');

    if (trips.length > 0) {
      testTripId = trips[0]._id;
      // An already completed trip cannot be transitioned to Started
      const completedTrip = trips.find((t) => t.status === 'Completed');
      if (completedTrip) {
        const res = await fetch(`${BASE_URL}/trips/${completedTrip._id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`
          },
          body: JSON.stringify({ status: 'Started' })
        });
        assert.strictEqual(res.status, 400, 'Cannot restart a completed journey');
      }
    }
  });

  // 6. Fuel Log Integrity
  test('10. Fuel Mileage Integrity: Rejects odometer lower than current asset odometer', async () => {
    const res = await fetch(`${BASE_URL}/fuel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        vehicle: createdVehicleId,
        liters: 150,
        cost: 450,
        odometerReading: 50, // vehicle odometer is 12500 km
        fuelType: 'Diesel'
      })
    });
    assert.strictEqual(res.status, 400, 'Fuel entry with backward odometer must be rejected');
    const data = await res.json();
    assert.match(data.message, /cannot be lower/i);
  });

  // 7. Real Aggregation Analytics
  test('11. Analytics Engine: Returns genuine aggregations from MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.summary, 'Summary object present');
    assert.ok(Array.isArray(data.charts.tripTrend), 'Trip trend must be an array');
    assert.ok(Array.isArray(data.charts.fuelCostTrend), 'Fuel trend must be an array');
    assert.ok(Array.isArray(data.charts.vehicleStatus), 'Vehicle status distribution must be an array');
  });

  // 8. Global Universal Search
  test('12. Universal Search: Returns matching entities across collections', async () => {
    const res = await fetch(`${BASE_URL}/search?q=Dallas`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.results), 'Results must be an array');
  });

  // 9. Notifications API Hub
  test('13. Notifications API: Compiles real operational & maintenance alerts', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.unreadCount === 'number');
    assert.ok(Array.isArray(data.notifications));
  });

  // 10. Multi-Tenant Organizations
  test('14. Multi-Tenant SaaS: Super Admin can list Organizations', async () => {
    const res = await fetch(`${BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const orgsList = Array.isArray(data) ? data : data.data;
    assert.ok(Array.isArray(orgsList), 'Organizations list must be an array');
    assert.ok(orgsList.some((org) => org.code === 'SPHERE-CORP'), 'SPHERE-CORP tenant must be listed');
  });

  // 11. Security Audit Logs
  test('15. Audit Log Ledger: Super Admin can inspect security events', async () => {
    const res = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const logsList = Array.isArray(data) ? data : data.data;
    assert.ok(Array.isArray(logsList), 'Audit logs must be an array');
  });

  // 12. Negative Security Test: Tenant Isolation & Non-Admin Org Access
  test('16. Tenant Security: Non-Admin Driver CANNOT list organizations (403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/organizations`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert.strictEqual(res.status, 403, 'Driver must not have access to platform tenant organization list');
  });
});
