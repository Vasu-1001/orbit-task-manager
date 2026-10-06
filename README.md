# ORBIT — Personal Work OS

> **Precision-engineered Task Management SaaS for Developers, Designers, and Modern Professionals.**  
> Built with React 19, TypeScript, Vite, Tailwind CSS, Express, PostgreSQL, and Cloudinary.

---

## 1. Project Overview

**ORBIT — Personal Work OS** is a SaaS application designed to eliminate cognitive fatigue and bring surgical clarity to everyday work. Unlike generic todo lists, ORBIT provides:
- **Multi-Horizon Workspaces**: Instant toggling between High-Information Grid Cards, Dense List View, and **Deadline Radar** (visual temporal grouping: Overdue, Due Today, Due Next 7 Days, and Upcoming Backlog).
- **Distraction-Free Focus Mode**: An isolated execution interface presenting one task at a time with an integrated Pomodoro timer and one-click completion.
- **Tenant Data Isolation**: Cryptographically enforced multi-user security where every database query and mutation is strictly scoped to the authenticated user ID.
- **High-Resolution Cloud Attachments**: Direct streaming to Cloudinary with responsive transformations, thumbnails, and automated asset cleanup upon task deletion.
- **Real-Time Workspace Telemetry**: Live completion velocity, overdue hazard alerts, and progress gauges computed dynamically from real database records.

---

## 2. Architecture & Data Flow

```mermaid
graph TD
    Client[React 19 + Vite Frontend SPA] -->|HTTPS / REST API| Express[Express.js REST API Server]
    
    subgraph Security Layer
        Express --> AuthMw[JWT Auth Middleware]
        Express --> ZodVal[Zod Schema Validators]
        Express --> HelmetRate[Helmet + Rate Limiting]
    end
    
    subgraph Persistence Layer
        AuthMw --> PgPool[PostgreSQL Connection Pool]
        PgPool --> UsersTable[(Users Table)]
        PgPool --> TasksTable[(Tasks Table with Foreign Keys & Indexes)]
    end
    
    subgraph Media & Notifications
        Express --> Cloudinary[Cloudinary Media CDN]
        Express --> Nodemailer[Nodemailer SMTP Service]
        Express --> CronScheduler[Node-Cron 24h Deadline Engine]
    end
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Curated warm neutrals, electric indigo accents, responsive light/dark themes)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Date Engine**: `date-fns`

### Backend
- **Runtime**: Node.js v20+
- **Server Framework**: Express.js
- **Language**: TypeScript
- **Security**: JWT (`jsonwebtoken`), `bcryptjs` (12 salt rounds), `helmet`, `cors`, `express-rate-limit`
- **Validation**: Zod
- **Database Client**: `pg` (node-postgres connection pool)
- **File Uploads**: `multer` (in-memory streaming)
- **Cloud Media**: Cloudinary SDK
- **Email Delivery**: Nodemailer (HTML responsive templates)
- **Job Scheduling**: `node-cron`
- **Testing**: Vitest + Supertest

---

## 4. Repository Folder Structure

```
task-manager/
├── client/                         # Frontend Application (React + Vite + TypeScript)
│   ├── public/                     # Static assets & SVG favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Button, Input, Modal, Badge, Toast, Skeleton
│   │   │   ├── dashboard/          # StatCard, WelcomeBanner
│   │   │   ├── focus/              # FocusModeModal
│   │   │   ├── layout/             # Navbar, Sidebar, AppLayout, ThemeToggle
│   │   │   └── tasks/              # TaskCard, TaskListItem, TaskModal, TaskFilters, DeadlineRadar
│   │   ├── context/                # AuthContext, TaskContext, ThemeContext, ToastContext
│   │   ├── pages/                  # Login, Register, Dashboard, TasksPage, NotFound
│   │   ├── services/               # api.ts (Typed Fetch client with interceptors)
│   │   ├── types/                  # TypeScript interface definitions
│   │   ├── utils/                  # date.ts (Deadline urgency & formatting)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                         # Backend Application (Express + TypeScript)
│   ├── src/
│   │   ├── config/                 # Environment loader & Zod validation
│   │   ├── controllers/            # auth.controller.ts, task.controller.ts
│   │   ├── db/
│   │   │   ├── migrations/         # 001_initial_schema.sql
│   │   │   ├── migrate.ts          # Migration runner
│   │   │   ├── pool.ts             # pg connection pool & fallback resilience layer
│   │   │   └── seed.ts             # Demo data seeder
│   │   ├── middleware/             # auth.middleware, error.middleware, rateLimit, upload
│   │   ├── routes/                 # auth.routes.ts, task.routes.ts
│   │   ├── services/               # auth, task, cloudinary, email, scheduler
│   │   ├── validators/             # auth.validator.ts, task.validator.ts
│   │   ├── app.ts                  # Express app factory
│   │   └── server.ts               # HTTP startup & graceful shutdown
│   ├── tests/                      # Automated Vitest test suite
│   │   ├── auth.test.ts            # Registration, login, duplicate email handling
│   │   ├── tasks.test.ts           # CRUD, validation, stats
│   │   └── isolation.test.ts       # Cross-tenant data isolation verification
│   └── package.json
│
├── .env.example                    # Production configuration template
├── vercel.json                     # Vercel deployment configuration
├── package.json                    # Monorepo root orchestration scripts
└── README.md
```

---

## 5. Database Schema & Multi-User Isolation

### Users Table (`users`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique User Identifier |
| `name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Normalized lowercase email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt salt-hashed password |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

### Tasks Table (`tasks`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique Task Identifier |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | NULLABLE | Detailed description |
| `status` | VARCHAR(20) | NOT NULL, CHECK (status IN ('pending', 'in_progress', 'completed')) | Current lifecycle stage |
| `priority` | VARCHAR(20) | NOT NULL, CHECK (priority IN ('low', 'medium', 'high', 'urgent')) | Execution urgency |
| `due_date` | TIMESTAMPTZ | NULLABLE | Scheduled completion target |
| `image_url` | TEXT | NULLABLE | HTTPS Cloudinary asset delivery URL |
| `image_public_id` | TEXT | NULLABLE | Cloudinary public asset ID |
| `owner_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Foreign key to owner |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Automatic update timestamp |

### Database Indexes
- `idx_tasks_owner_id`: Enforces instant owner-scoped lookups.
- `idx_tasks_owner_status`: Accelerates status filtering for large task sets.
- `idx_tasks_owner_due_date`: Enables high-speed Deadline Radar and cron sorting.
- `idx_users_email`: Guarantees O(1) email lookups on authentication.

---

## 6. Getting Started Locally

### Prerequisites
- **Node.js**: v20 or later (`node -v`)
- **npm**: v9 or later (`npm -v`)
- **PostgreSQL**: (Optional for local dev — app includes a resilient offline store, but recommended for production verification)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/orbit-task-manager.git
cd orbit-task-manager

# Install dependencies for both server and client
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and `client/.env`:
```bash
cp .env.example server/.env
cp .env.example client/.env
```

Set your PostgreSQL connection string in `server/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orbit_db
```

### 3. Run Database Migrations & Seed Demo Data
```bash
npm run migrate
npm run seed
```

### 4. Start Development Servers
From the repository root:
```bash
# Start backend API (http://localhost:5000)
npm run dev:server

# Start frontend (http://localhost:5173) in a second terminal
npm run dev:client
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 7. Demo Account Setup

For evaluation and company review, ORBIT provides instant 1-click access:
- Click **"Explore as Demo User"** on the Login screen, or sign in manually with:
  - **Email**: `demo@orbit.app`
  - **Password**: `DemoPassword123!`

---

## 8. API Endpoint Documentation

All endpoints return consistent JSON responses with appropriate HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`).

### Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` (or `/register`) | Public | Register new user; returns JWT & user object |
| `POST` | `/auth/login` (or `/login`) | Public | Authenticate user; returns JWT & sets HttpOnly cookie |
| `POST` | `/auth/logout` | Authenticated | Clears session cookie |
| `GET` | `/auth/me` | Authenticated | Returns current authenticated user profile |

### Task Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/tasks/` | Authenticated | List tasks with filters (`status`, `priority`, `search`, `sortBy`, `sortOrder`) |
| `POST` | `/tasks/` | Authenticated | Create new task scoped to verified `owner_id` |
| `GET` | `/tasks/:id` | Authenticated | Retrieve specific task (enforces tenant isolation) |
| `PUT` | `/tasks/:id` | Authenticated | Update task fields (enforces tenant isolation) |
| `DELETE` | `/tasks/:id` | Authenticated | Delete task & trigger Cloudinary asset cleanup |
| `GET` | `/tasks/stats` | Authenticated | Aggregate statistics (total, pending, in-progress, completed, overdue, velocity) |
| `POST` | `/tasks/upload-image` | Authenticated | Multipart upload to Cloudinary (max 5MB, JPEG/PNG/WEBP/GIF) |

### Health Check
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Returns server health, uptime, and timestamp |

---

## 9. Automated Testing & Verification

Automated tests are written with Vitest and Supertest covering 20 critical scenarios:
1. **Authentication API**:
   - Successful registration & password hashing verification
   - Rejection of duplicate email (409 Conflict)
   - Password strength validation (min 8 chars, letters & numbers)
   - Successful login & JWT issuance
   - Rejection of incorrect credentials (401 Unauthorized)
   - Token-based `/auth/me` profile lookup
2. **Task CRUD**:
   - Task creation with valid fields
   - Validation failures (empty title, invalid status enum)
   - List retrieval scoped to user
   - Single task lookup by UUID
   - Status & priority updates
   - Workspace statistics calculation
   - Record deletion & subsequent 404 confirmation
3. **Multi-User Data Isolation**:
   - User B attempting to read User A's task returns `404 Not Found`
   - User B attempting to update User A's task returns `404 Not Found`
   - User B attempting to delete User A's task returns `404 Not Found`
   - User B's task list does not leak User A's tasks
   - Client attempts to forge `owner_id` in request body are rejected/overridden

### Run Tests
```bash
npm run test
```

Expected output:
```
 ✓ tests/tasks.test.ts (8 tests)
 ✓ tests/isolation.test.ts (5 tests)
 ✓ tests/auth.test.ts (7 tests)

 Test Files  3 passed (3)
      Tests  20 passed (20)
```

---

## 10. Cloudinary & Email Configuration

### Cloudinary Image Hosting
1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. Obtain your **Cloud Name**, **API Key**, and **API Secret** from the Dashboard.
3. Add them to `server/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Email Notification System
ORBIT includes responsive HTML email templates for:
- **Welcome Email**: Sent automatically upon user registration.
- **24-Hour Deadline Reminder**: Dispatched by the background scheduler for tasks due within 24 hours.

Configure your SMTP provider in `server/.env`:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your_api_key_or_password
EMAIL_FROM="ORBIT Work OS <noreply@orbit.app>"
```
*(If left unconfigured in local development, emails are logged to the console via simulated mock transport to prevent crashes).*

---

## 11. Production Deployment

### Frontend (Vercel)
1. Push your repository to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `client`.
3. Set the build command to `npm run build` and output directory to `dist`.
4. Configure the environment variable:
   - `VITE_API_URL`: `https://your-api-domain.com`

### Backend (Render / Railway / AWS / Vercel Serverless)
1. Deploy the `server/` directory to a Node.js hosting platform (e.g., Render Web Service or Railway).
2. Set environment variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `DATABASE_URL`: `postgresql://user:password@neon-or-supabase-host:5432/dbname`
   - `JWT_SECRET`: A secure 64-character random string
   - `CLOUDINARY_*` and `EMAIL_*` variables
3. Run `npm run migrate` in production build step or release command.

---

## 12. Distinctive SaaS Features

1. **Focus Mode**: Activated with shortcut `F` or via navigation. Centers on one task at a time, eliminating UI noise, with an integrated 25-minute Pomodoro session timer.
2. **Deadline Radar**: Visual time-horizon grouping of tasks (Overdue, Due Today, Due Next 7 Days, and Upcoming Backlog).
3. **Task Insights**: Real-time velocity gauge calculating authenticated user completion rate and workload distribution.
4. **Global Power Shortcuts**:
   - `N`: Instantly open New Task dialog from anywhere.
   - `F`: Launch Focus Mode console.
   - `Esc`: Close open modals and return to workspace.
5. **Theme Engine**: Seamless toggle between Refined Light and Midnight Dark themes with persistent system preference memory.

---

## License

Proprietary — Created for ORBIT Personal Work OS. All rights reserved.
