<div align="center">
  <h1>SmartFlow</h1>
  <p>Workflow management platform with task tracking, approval pipelines, resource control, and live operations data in one unified dashboard.</p>
</div>

## Problem Statement

Managing tasks, approvals, resources, and team visibility across daily operations is often fragmented and inconsistent. Teams need one place to plan work, approve requests, monitor resources, and track progress with reliable backend data. SmartFlow solves this by combining workflow modules, analytics, and operational controls into a single full-stack platform.

## Features

### Task Management and Work Execution

- **Task Lifecycle Management:** Create, update, detail-view, and delete tasks with title, description, priority, deadline, and assignee mapping.
- **Status Pipeline:** Built-in workflow states (`pending`, `in-progress`, `review`, `completed`) to track execution progress.
- **Task Filtering and Search:** Filter by status, priority, assignee, and search text for fast retrieval.
- **Task Activity Context:** Task cards and detail views include comment and attachment counts.

### Approval and Decision Flow

- **Approval Requests:** Create and manage approval records with type, department, requester, status, and decision metadata.
- **Approve/Reject Actions:** Operational status updates from pending to approved/rejected.
- **Approval Visibility:** Frontend approvals page fetches and filters records by state.

### Resource Management and Allocation

- **Resource Inventory:** Manage devices, software, rooms, and equipment in one module.
- **Allocation Tracking:** Track resources by status (`available`, `assigned`, `maintenance`) and assigned user.
- **Operational Actions:** Create resources, assign/release allocations, and monitor utilization over time.

### Dashboard, Reporting, and Notifications

- **Live KPI Dashboard:** Total tasks, pending approvals, resources in use, and completed tasks sourced from database queries.
- **Chart Data from DB:** Weekly and monthly visual datasets generated from live records.
- **Activity Feed:** Recent activity stream for operational visibility.
- **Notifications Center:** Fetch, mark read, and delete notifications with user-scoped filtering.
- **Reports Module:** Backend reporting endpoint for business summaries and trend views.

### User, Profile, and Settings Management

- **Authentication:** Email/password login and registration with hashed passwords.
- **Profile Management:** User profile retrieval and updates including avatar uploads.
- **User Administration:** Users list endpoint and admin panel statistics.
- **Settings Controls:** Theme and preference retrieval/update through backend settings APIs.

## Architecture

![Architecture](diagram/Architecture.png)

## Application Flow

1. User opens frontend and lands on login/public page.
2. Frontend sends authentication request to backend and receives session/token response.
3. Authenticated state is stored on client and protected routes become accessible.
4. Frontend calls backend endpoints under `/backend/*.php` for tasks, approvals, resources, profile, notifications, settings, and reports.
5. Backend controllers validate inputs, execute business logic, and query MySQL through PDO.
6. Dashboard endpoints aggregate KPIs/charts from live data and return JSON payloads.
7. CRUD and status actions write operational changes back to database tables.
8. Notification and activity tables capture system/user events for visibility.
9. Frontend updates module views from response payloads.
10. Users continue workflow operations from a unified dashboard shell.

### Core Request Pipeline

`React Client -> Fetch API -> PHP Endpoint (/backend/*.php) -> config.php/PDO -> MySQL -> JSON Response -> UI State Update`

## Tech Stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui  
**Backend:** PHP 7+  
**Database:** MySQL (PDO)  
**Security & Auth:** Password hashing, session/token-based client auth state, CORS headers

## How It Works

1. Users sign in with credentials against the `users` table.
2. Backend validates credentials and returns user/token response.
3. Frontend uses authenticated requests for all protected modules.
4. Backend endpoints perform CRUD and aggregation across tasks, approvals, resources, notifications, and activities.
5. Dashboard and reports render from live database values.

## Installation / Setup

```bash
git clone https://github.com/Nirjar26/SmartFlow.git
cd SmartFlow

npm install
```

```bash
# Start backend server from project root (required for /backend path)
php -S localhost:8000

# Start frontend (separate terminal)
npm run dev
```

## Environment Variables

Configure values in `backend/.env`:

```env
DB_HOST=localhost
DB_NAME=flowstone_db
DB_USER=root
DB_PASS=

APP_ENV=development
API_BASE_URL=http://localhost:8000/backend
FRONTEND_URL=http://localhost:8080
```

## API Endpoints

- `POST /backend/login.php`
- `POST /backend/register.php`
- `GET /backend/dashboard.php`
- `GET /backend/tasks.php`
- `POST /backend/create_task.php`
- `POST /backend/update_task.php`
- `POST /backend/delete_task.php`
- `GET /backend/task_detail.php?id=:id`
- `GET|POST|PUT /backend/approvals.php`
- `GET|POST|DELETE /backend/resources.php`
- `GET|POST|DELETE /backend/notifications.php`
- `GET /backend/profile.php?id=:id`
- `POST /backend/update_profile.php`
- `POST /backend/upload_avatar.php`
- `GET|POST /backend/settings.php`
- `GET /backend/reports.php`
- `GET /backend/users.php`

## Folder Structure

```text
.
├── backend/
│   ├── config.php
│   ├── full_schema.sql
│   ├── migrations/
│   ├── scripts/
│   │   ├── reset_admin_credentials.php
│   │   └── reset_minimal_data.php
│   ├── uploads/
│   │   └── avatars/
│   └── *.php
├── src/
│   ├── admin/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── diagram/
├── docs/
├── public/
├── package.json
└── README.md
```

## Minimal Baseline Data

To clear large data and keep only a small baseline set:

```bash
php backend/scripts/reset_minimal_data.php
```

Default admin credentials:

```text
Email: admin@flowstone.com
Password: password123
```

## Author / Contact

Nirjar Goswami  
GitHub: https://github.com/Nirjar26

Associated with CHARUSAT.
