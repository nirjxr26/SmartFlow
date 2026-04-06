<div align="center">
  <h1>FlowStone</h1>
  <p>Enterprise-grade team operations platform for managing tasks, approvals, resources, and workflows with a modern React frontend and PHP backend.</p>
</div>

## Problem Statement

Many organizations struggle with disconnected work management tools, manual approval tracking, and limited visibility into team resources. FlowStone solves this by unifying task assignment, approval workflows, resource planning, and analytics in one place.

## Features

### Authentication & Access Control
- **Secure login:** Email/password authentication with session support.
- **Role-based access:** Admin and user permissions control dashboard access and management flows.
- **Profile management:** Users can update profile details, department, bio, and avatar.

### Task Management
- **Task lifecycle tracking:** Create, assign, update, and delete tasks with status workflows.
- **Priority and deadline handling:** Tasks support priority levels, due dates, and assignees.
- **Task detail views:** Drill into task descriptions, assignee info, and progress details.

### Approvals & Workflow
- **Approval pipelines:** Review and approve task requests with status categorization.
- **Approval tracking:** View pending, approved, and rejected approval items in one place.
- **Confirmation dialogs:** Reduce accidental actions with built-in confirmations.

### Resource Management
- **Resource cards:** Track team resources, availability, and utilization.
- **Search and filtering:** Filter resources and tasks by status, priority, and assignee.
- **Overview dashboards:** Surface resource summaries and workload distribution.

### Reporting & Notifications
- **Analytics dashboards:** Visualize metrics with charts and KPI summaries.
- **Activity feed:** Monitor recent updates and team actions.
- **Notifications:** Real-time notification center for important updates and alerts.

## Architecture

<p align="center">
  <img src="./diagram/Architecture.png" alt="FlowStone Architecture" width="720" height="420" style="max-width:100%; object-fit:contain;" />
</p>

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, shadcn/ui
**Backend:** PHP, REST APIs
**Database:** MySQL (via PHP PDO)
**UI / UX:** Radix primitives, Framer Motion, Recharts

## How It Works

1. Users sign in through the frontend and authenticate against the PHP backend.
2. The backend serves user profiles, tasks, approvals, and resource data.
3. Users create and update tasks, with status changes reflected in the dashboard.
4. Approval actions are processed through backend endpoints and displayed in summary views.
5. Reports and notifications keep users informed of relevant activity.

## Installation / Setup

```bash
git clone https://github.com/<your-username>/FlowStone-1.git
cd FlowStone-1
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
php setup.php
php update_schema.php
php setup_tasks.php
php -S localhost:8000
```

## Environment Variables

The backend uses PHP configuration and default database settings defined in the backend scripts. For local setup, ensure your PHP environment can start the built-in server.

## API Endpoints

- `POST /login.php`
- `POST /register.php`
- `GET /profile.php?id={user_id}`
- `POST /update_profile.php`
- `GET /tasks.php`
- `GET /task_detail.php?id={task_id}`
- `POST /create_task.php`
- `POST /update_task.php`
- `POST /delete_task.php`

## Folder Structure

```text
.
├── backend/
│   ├── approvals.php
│   ├── create_task.php
│   ├── dashboard.php
│   ├── login.php
│   ├── profile.php
│   ├── register.php
│   ├── tasks.php
│   ├── update_task.php
│   ├── setup.php
│   ├── update_schema.php
│   ├── setup_tasks.php
│   └── uploads/
├── public/
│   └── robots.txt
├── src/
│   ├── admin/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── App.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## License

MIT License

## Author / Contact

Nirjar Goswami  
GitHub: https://github.com/Nirjar26
