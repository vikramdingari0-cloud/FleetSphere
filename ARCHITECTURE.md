# FleetSphere — System Architecture & Security Specification

## 1. Architectural Principles

FleetSphere is architected around the following foundational principles:

1. **Defense-in-Depth**: Security boundaries are enforced at the HTTP gateway, authentication middleware, controller service layer, and database query filters. Client-side state is treated purely as user interface convenience.
2. **Strict Multi-Tenancy**: Every domain entity (`Vehicle`, `Driver`, `Trip`, `MaintenanceJob`, `FuelEntry`, `Expense`, `Incident`, `Document`, `AuditLog`) holds a required reference to an `Organization`.
3. **Broken Object Level Authorization (BOLA) Prevention**: Object identifiers (`:id`) passed in URLs or payloads are validated against the authenticated user's organization (`req.tenantFilter`) and branch (`req.branchFilter`).
4. **Resilient Data Fallback**: The development environment connects to local MongoDB with an automatic seamless fallback to `mongodb-memory-server` when external services are unreachable.

---

## 2. Request Lifecycle & Security Flow

```
Client Request
      │
      ▼
Helmet Security Headers (CSP, FrameGuard, HSTS, SniffProtect)
      │
      ▼
Express Rate Limiter (General API: 500 req / 15m; Auth: 30 req / 15m)
      │
      ▼
CORS Validation (Origin Whitelist)
      │
      ▼
JWT Bearer Token Extraction (`authMiddleware.protect`)
      │
      ▼
Tenant & Branch Scoping (`branchScope`, `canAccessTenant`, `canAccessBranch`)
      │
      ▼
Business Logic & State Machine Validation
      │
      ▼
MongoDB Mongoose Query (Scoped to tenant & branch)
      │
      ▼
Audit Log Record (`logAuditAction`)
      │
      ▼
Sanitized JSON Response (Sensitive fields omitted)
```

---

## 3. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Super Admin | Fleet Manager | Branch Manager | Finance Officer | Driver |
|---|:---:|:---:|:---:|:---:|:---:|
| **Manage Organizations** | Full CRUD | Denied | Denied | Denied | Denied |
| **Manage Branches** | Full CRUD | Read-Only | Scoped Read | Denied | Denied |
| **Manage Vehicles** | Full CRUD | Full CRUD | Scoped CRUD | Read-Only | Read-Only |
| **Schedule Dispatches** | Full CRUD | Full CRUD | Scoped CRUD | Denied | Denied |
| **Update Trip Status** | Permitted | Permitted | Permitted | Denied | Assigned Only |
| **Approve Expenses** | Permitted | Permitted | Scoped Permitted | Permitted | Denied |
| **Submit Fuel Log** | Permitted | Permitted | Permitted | Permitted | Assigned Vehicle |
| **Inspect Audit Logs** | Global Ledger | Branch Scoped | Branch Scoped | Denied | Denied |

---

## 4. Odometer & Lifecycle Integrity Rules

1. **Trip Lifecycle**:
   - `Planned` ➔ `Assigned` ➔ `Started` ➔ `Completed` (or `Cancelled`).
   - Trips marked `Completed` cannot be restarted.
   - Trips marked `Cancelled` cannot transition to `Started`.
   - Completion requires `endOdometer >= startOdometer`.
2. **Fuel Validation**:
   - Odometer readings cannot be lower than the vehicle's `currentOdometer`.
3. **Maintenance Work Orders**:
   - Marking completed requires `actualCost >= 0` and `completedOdometer >= currentOdometer`.
   - Automatically releases vehicle state back to `Available`.
