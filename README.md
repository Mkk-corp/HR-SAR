# HR-SAR — Saudi HR Management System

A full-stack Arabic HR management web application built with **React + ASP.NET Core 10 + SQL Server**.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router v7 |
| Backend | ASP.NET Core 10 Web API |
| Database | SQL Server (LocalDB / Express) |
| ORM | Entity Framework Core 10 |
| Auth | ASP.NET Identity + JWT Bearer |
| API Docs | Swagger / OpenAPI |

---

## Prerequisites

Install all of the following before you start:

| Tool | Version | How to check |
| --- | --- | --- |
| [.NET 10 SDK](https://dotnet.microsoft.com/download) | 10.0 | `dotnet --version` |
| [SQL Server](https://www.microsoft.com/sql-server/sql-server-downloads) | Express or LocalDB | `sqllocaldb info` |
| [Node.js](https://nodejs.org) | 20+ | `node --version` |
| npm | 10+ | `npm --version` |

Also install the EF Core CLI tool if you don't have it:

```bash
dotnet tool install --global dotnet-ef
```

---

## How the Pieces Connect

```
┌─────────────────────┐        HTTP/JSON         ┌──────────────────────────┐
│  Frontend (React)   │  ──────────────────────►  │  Backend (ASP.NET Core)  │
│  localhost:5173     │  Authorization: Bearer JWT │  localhost:5140          │
└─────────────────────┘                           └────────────┬─────────────┘
                                                               │ Entity Framework
                                                               ▼
                                                  ┌──────────────────────────┐
                                                  │  SQL Server              │
                                                  │  Database: HR_SAR_DB     │
                                                  └──────────────────────────┘
```

- The **frontend** sends every request to `http://localhost:5140/api` — configured in `frontend/src/api/client.js`.
- The **backend** has CORS set to allow all origins in development, so no extra config is needed.
- The **backend** connects to SQL Server using the connection string in `APIs/HR-SAR/appsettings.json`.
- When the backend starts, it **automatically applies any pending migrations** and seeds the database.

---

## Setup & Run — Step by Step

### Step 1 — Configure the Database Connection

Open `APIs/HR-SAR/appsettings.json` and verify the connection string matches your SQL Server setup:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=HR_SAR_DB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

| Part | Meaning |
| --- | --- |
| `Server=.` | Local SQL Server instance on the current machine |
| `Database=HR_SAR_DB` | Database name — created automatically on first run |
| `Trusted_Connection=True` | Windows Authentication — no username/password needed |
| `TrustServerCertificate=True` | Skip SSL certificate check in development |

> **Using SQL Server Express?** Change `Server=.` to `Server=.\SQLEXPRESS`
>
> **Using LocalDB?** Change `Server=.` to `Server=(localdb)\MSSQLLocalDB`

---

### Step 2 — Start the Backend

Open a terminal and run:

```bash
cd APIs/HR-SAR
dotnet run
```

On first run, the backend will automatically:

1. Apply all EF Core migrations to create the `HR_SAR_DB` database
2. Seed the database with default roles, permissions, and the admin account

You should see:

```
info: Now listening on: http://localhost:5140
```

**Verify it is working** — open this URL in your browser:

```
http://localhost:5140/swagger
```

You should see the Swagger UI with all API endpoints listed.

---

### Step 3 — Install Frontend Dependencies

Open a **second terminal** and run:

```bash
cd frontend
npm install
```

> Only needed once, or when `package.json` changes.

---

### Step 4 — Start the Frontend

In the same second terminal:

```bash
npm run dev
```

You should see:

```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 5 — Open the App and Log In

Open your browser and go to:

```
http://localhost:5173
```

Sign in with the default admin account:

```
Email:    admin@hr-sar.com
Password: Admin@123456
```

---

## Verifying Frontend ↔ Backend Communication

After logging in, if the dashboard loads (even with zero stats), the connection is working.

To manually verify:

1. Open browser DevTools → **Network** tab
2. Log in — you should see `POST /api/auth/login` returning `200 OK` with a JWT token
3. Navigate to **Employees** — you should see `GET /api/employees` returning `200 OK`

If you see `ERR_CONNECTION_REFUSED` on API calls, the backend is not running — go back to Step 2.

---

## Summary — Two Terminals Always Running

| Terminal | Command | URL |
| --- | --- | --- |
| Terminal 1 — Backend | `cd APIs/HR-SAR && dotnet run` | `http://localhost:5140` |
| Terminal 2 — Frontend | `cd frontend && npm run dev` | `http://localhost:5173` |

Both must be running at the same time for the app to work.

---

## Configuration Files

### Backend — `APIs/HR-SAR/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=HR_SAR_DB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "HR-SAR-SuperSecret-JWT-Key-2026-MustBe32CharsMin!",
    "Issuer": "HR-SAR",
    "Audience": "HR-SAR-Client",
    "ExpiryHours": "24"
  }
}
```

### Frontend API base — `frontend/src/api/client.js`

```js
const API_BASE = 'http://localhost:5140/api';
```

If you change the backend port, update this value to match.

### Backend port — `APIs/HR-SAR/Properties/launchSettings.json`

```json
"applicationUrl": "http://localhost:5140"
```

---

## Database Details

**Name:** `HR_SAR_DB`  
**Engine:** SQL Server

| Table | Contents |
| --- | --- |
| `Employees` | Employee records |
| `Facilities` | Facilities with parent/child hierarchy |
| `Transfers` | Transfer requests (internal & external) |
| `Permissions` | All system permission constants |
| `RolePermissions` | Role ↔ Permission assignments |
| `AspNetUsers` | User accounts |
| `AspNetRoles` | Roles: SuperAdmin, Manager, Employee |
| `AspNetUserRoles` | User ↔ Role assignments |

The database is created and seeded **automatically** on first backend startup. No manual SQL scripts needed.

To manually apply migrations (optional):

```bash
cd APIs/HR-SAR
dotnet ef database update
```

---

## Default Accounts & Roles

| Account | Email | Password | Role |
| --- | --- | --- | --- |
| System Admin | `admin@hr-sar.com` | `Admin@123456` | SuperAdmin |

| Role | Access |
| --- | --- |
| **SuperAdmin** | Full access to all modules |
| **Manager** | Dashboard, Employees (view/create/edit), Facilities (view), Transfers (view/create), Reports, Profile |
| **Employee** | Dashboard (view), Transfers (view), Profile |

---

## Project Structure

```
HR-SAR/
├── APIs/HR-SAR/                  # Backend — ASP.NET Core 10
│   ├── Controllers/              # REST API endpoints
│   ├── Data/
│   │   ├── AppDbContext.cs       # EF Core DbContext
│   │   └── DataSeeder.cs        # Auto-seeds DB on startup
│   ├── DTOs/                     # Request/response shapes
│   ├── Migrations/               # EF Core migrations
│   ├── Models/                   # Domain models + Permissions constants
│   ├── Services/                 # Business logic layer
│   ├── appsettings.json          # DB connection + JWT config
│   ├── Properties/launchSettings.json  # Port configuration
│   └── Program.cs                # Startup: CORS, Auth, DI, Seeder
│
├── frontend/                     # Frontend — React + Vite
│   ├── src/
│   │   ├── api/                  # One module per API resource
│   │   │   └── client.js         # Base fetch wrapper with JWT + API_BASE
│   │   ├── components/           # Shared layout (Sidebar, TopBar) + UI
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # JWT state + hasPermission()
│   │   ├── pages/                # Dashboard, Employees, Facilities,
│   │   │                         # Transfers, Users, Roles, Profile, Login
│   │   ├── styles/
│   │   │   └── global.css        # CSS variables + RTL shared classes
│   │   ├── App.jsx               # Router + AuthProvider + ToastProvider
│   │   └── main.jsx              # Entry point
│   └── index.html
│
├── Documents/
│   ├── BRD.md                    # Business Requirements Document
│   └── SRS.md                    # System Requirements Specification
└── README.md
```

---

## Troubleshooting

| Problem | Likely Cause | Fix |
| --- | --- | --- |
| `Cannot connect to SQL Server` | SQL Server service not running | Run `sqllocaldb start MSSQLLocalDB` or start SQL Server from Services |
| API calls fail after login page loads | Backend not running | Run `cd APIs/HR-SAR && dotnet run` |
| `CORS error` in browser console | Backend not running on port 5140 | Confirm `dotnet run` output shows `localhost:5140` |
| `Port 5140 already in use` | Another process on that port | Run `netstat -ano \| findstr :5140`, kill the PID, or change the port in `launchSettings.json` and update `client.js` |
| `npm run dev` fails | Dependencies not installed | Run `npm install` inside the `frontend/` folder first |
| `dotnet ef: command not found` | EF CLI not installed | `dotnet tool install --global dotnet-ef` |
| Login returns `401` | DB not migrated or seeded | Run `dotnet ef database update` then restart the backend |
| All pages redirect to `/login` | Token expired or missing | Log out and sign back in |
