# FleetSphere — Production Deployment Guide

This guide documents the enterprise deployment architecture for FleetSphere across **Render** (Node.js/Express API Gateway), **Vercel** (React/Vite SPA), and **MongoDB Atlas** (Managed Multi-Tenant Document Store).

---

## 1. Architecture Topology

```
                  ┌──────────────────────┐
                  │    Clients / Web     │
                  └──────────┬───────────┘
                             │ HTTPS
                             ▼
                  ┌──────────────────────┐
                  │   Vercel Edge CDN    │
                  │ (React SPA Frontend) │
                  └──────────┬───────────┘
                             │ REST / HTTPS
                             ▼
                  ┌──────────────────────┐
                  │      Render Web      │
                  │   (Express Backend)  │
                  └──────────┬───────────┘
                             │ TLS
                             ▼
                  ┌──────────────────────┐
                  │  MongoDB Atlas Clust │
                  │ (Multi-Tenant Store) │
                  └──────────────────────┘
```

---

## 2. Backend Deployment (Render)

### Option A: Render Blueprint (Recommended)
FleetSphere includes a root [`render.yaml`](file:///c:/SUNTEK/FLEETSPHERE/render.yaml) specification:
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New** ➔ **Blueprint**.
3. Connect your repository: `https://github.com/vikramdingari0-cloud/FleetSphere`.
4. Render detects `render.yaml` and provisions `fleetsphere-api`.

### Option B: Manual Web Service Setup
1. **Service Type**: Web Service
2. **Root Directory**: `backend`
3. **Runtime**: Node
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Health Check Path**: `/api/health`

### Environment Variables on Render
| Variable | Value / Description | Required |
|---|---|---|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` | Yes |
| `MONGODB_URI` | `mongodb+srv://<user>:<pwd>@cluster0.abcde.mongodb.net/fleetsphere?retryWrites=true&w=majority` | Yes |
| `JWT_SECRET` | 32+ character random secret string | Yes |
| `CLIENT_URL` | `https://fleetsphere.vercel.app` (or comma-separated allowed origins) | Yes |

---

## 3. Frontend Deployment (Vercel)

### Deployment Steps
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import `vikramdingari0-cloud/FleetSphere`.
4. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Environment Variables on Vercel
| Variable | Value / Description | Required |
|---|---|---|
| `VITE_API_URL` | `https://fleetsphere-api.onrender.com` | Yes |

*Note: [`frontend/vercel.json`](file:///c:/SUNTEK/FLEETSPHERE/frontend/vercel.json) handles SPA client-side routing rewrites and sets strict security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).*

---

## 4. Database Initialization (MongoDB Atlas)

To seed initial enterprise organizations, hub branches, and test users:
```bash
cd backend
npm run seed
```

### Pre-configured Demo Accounts
| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `admin@fleetsphere.com` | `password123` | Global Enterprise Tenant |
| **Fleet Manager** | `fleet@fleetsphere.com` | `password123` | All Branches & Assets |
| **Branch Manager** | `branch.dallas@fleetsphere.com` | `password123` | Dallas Central Hub (DAL-01) |
| **Finance Officer** | `finance@fleetsphere.com` | `password123` | Accounting & Disbursed Spend |
| **Driver** | `driver.john@fleetsphere.com` | `password123` | Assigned Commercial Vehicle |

---

## 5. Verification & Health Monitoring

1. **API Health**:
   ```bash
   curl -I https://fleetsphere-api.onrender.com/api/health
   # HTTP/1.1 200 OK
   # Content-Type: application/json
   # {"status":"ONLINE","service":"FleetSphere Core Telematics API"}
   ```
2. **Automated Test Suite**:
   ```bash
   cd backend
   npm test
   # 16 tests passing, 0 failures
   ```
