<div align="center">
  <h1>FlowStone</h1>
  <p>Enterprise-grade team operations platform for managing tasks, approvals, resources, and workflows with a modern React frontend and PHP backend.</p>
</div>

## Problem Statement

FlowStone brings together task management, approval workflows, and resource planning into a single team operations platform. It solves the gap between scattered work tools and poor visibility by giving teams one place to manage work, approvals, and reporting.

## Features

### Authentication & Access Control
- **Secure login:** Email/password authentication with session management for protected access.
- **Role-based access:** Admin and user roles determine dashboard visibility, task control, and approval permissions.
- **Profile management:** Edit user details, department, bio, and avatar for a personalized workspace.

### Task & Workflow Management
- **Task lifecycle tracking:** Create, assign, update, and delete tasks across pending, in-progress, review, and completed states.
- **Approval pipelines:** Route task requests through approval workflows with clear pending, approved, and rejected states.
- **Priority and deadlines:** Prioritize work and enforce deadlines for better delivery coordination.

### Resource & Reporting
- **Resource tracking:** Monitor team resources, availability, and workload through resource cards.
- **Analytics dashboards:** Visualize task trends, approval volume, and resource summaries with charts.
- **Notifications:** Stay informed with real-time alerts for tasks, approvals, and team activity.

## Architecture / Flow

<p align="center">
  <img src="./diagram/Architecture.png" alt="FlowStone Architecture" width="720" height="520" style="max-width:100%; object-fit:contain;" />
</p>

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS  
**Backend:** PHP, REST APIs  
**Database:** MySQL  
**UI / UX:** Radix, Framer Motion, Recharts

## How It Works

1. Users sign in through the React frontend and authenticate with the PHP backend.
2. The backend serves user profiles, task data, approval workflows, and resource summaries.
3. Users manage tasks and approvals; the frontend reflects updates through API calls.
4. Backend APIs process task creation, updates, and approval actions.
5. Dashboard analytics aggregate work, approvals, and notifications for team oversight.

## Installation / Setup

```bash
git clone https://github.com/Nirjar26/FlowStone.git
cd FlowStone-1
npm install
npm run dev
```

## Environment Variables

```env
DB_HOST=
DB_NAME=
DB_USER=
DB_PASS=
```

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
├── diagram/
│   └── Architecture.png
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
