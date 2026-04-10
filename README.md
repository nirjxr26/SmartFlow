<div align="center">
  <h1>SmartFlow</h1>
  <p>Task and resource management platform with real-time dashboards, approval workflows, resource tracking, and notifications in one unified system..</p>
</div>

## Problem Statement

Managing tasks, approvals, and resources across modern organizations is often fragmented and inefficient. Teams need centralized task scheduling, streamlined approval processes, resource allocation tracking, and clear visibility into organizational activities. SmartFlow solves this by combining task management, approval workflows, resource management, and real-time notifications into a single, integrated platform.

## Features

### Task Management
- **Create & Manage Tasks**: Create, update, delete tasks with detailed descriptions
- **Task Status Tracking**: Monitor task progression (pending, in-progress, review, completed)
- **Task Assignment**: Assign tasks to users for distributed work management
- **Task Detail View**: View comprehensive task information and history

### Approval Workflows
- **Submit Approval Requests**: Request approvals for various request types
- **Approve/Reject**: One-click approval and rejection of pending requests
- **Approval History**: Track all approval decisions and statuses
- **Real-Time Status Updates**: View current approval status and outcomes

### Resource Management
- **Resource Inventory**: Track organizational resources (devices, software, rooms, equipment)
- **Resource Assignment**: Assign resources to users
- **Resource Status Tracking**: Monitor availability and allocation status
- **Resource Management Dashboard**: View all resources with current assignments

### Notifications
- **Real-Time Notifications**: Stay informed of task, approval, and resource updates
- **Notification Center**: View, mark as read, and delete notifications
- **User Activity Tracking**: See notification history and updates

### Dashboard & Analytics
- **KPI Dashboard**: Display key metrics (tasks, approvals, resources, user stats)
- **Activity Feed**: Real-time updates on user actions and system events
- **Dynamic Charts**: Visual representation of task distribution and resource utilization
- **Report Generation**: Generate reports on tasks, approvals, and resources

### User Management
- **User Registration**: Create new user accounts with email/password
- **Login & Session Management**: Secure user authentication and sessions
- **User Profiles**: Manage user information and settings
- **Avatar Upload**: Upload and update user profile pictures
- **Admin Panel**: View user statistics and manage application settings

## Architecture

![FlowStone Architecture](diagram/Architecture.png)

## Application Flow

1. **User Access**: User opens frontend and lands on login or register page
2. **Authentication**: On successful login, backend verifies credentials against database
3. **Session Management**: Backend creates user session and frontend stores authentication state
4. **Protected Routes**: Unauthenticated users are redirected to login; authenticated users access protected pages
5. **API Requests**: Frontend sends requests to PHP backend API endpoints
6. **Authorization**: Backend validates user session and permissions for requested action
7. **Business Logic**: PHP controllers execute actions (tasks, approvals, resources, notifications)
8. **Data Persistence**: Operations are executed against PostgreSQL database
9. **Response**: Backend returns JSON response with updated data
10. **Frontend Update**: React components update UI with fresh data

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Shadcn/ui (component library)
- Lucide React (icons)

**Backend:**
- PHP 7+
- PostgreSQL (database)

**Security & Auth:**
- Password hashing with bcrypt
- Session-based authentication
- CORS configuration

## How It Works

1. Users authenticate via email/password with secure session handling
2. Backend validates credentials and creates user session
3. Protected routes enforce authentication checks before allowing access
4. Task and approval workflows are managed through PHP endpoints
5. Resources are tracked and allocated with status management
6. Real-time notifications alert users to important events and status changes
7. Dashboard aggregates metrics from database for holistic view
8. All data is persisted in PostgreSQL database

## Installation / Setup

```bash
# Clone the repository
git clone https://github.com/your-username/SmartFlow.git

cd SmartFlow

# Setup backend
cd backend
# Configure database and run setup

# Setup frontend
cd ../frontend
npm install

# Run frontend (default: port 5173)
npm run dev
```

## Environment Variables

Configure environment values in `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowstone
DB_USER=postgres
DB_PASSWORD=

# Server
php -S localhost:8000

# Frontend URL (optional)
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication
```
POST   /login.php               - User login
POST   /register.php            - User registration
GET    /profile.php             - Get current user profile
POST   /logout.php              - User logout
```

### Tasks
```
GET    /tasks.php               - List all tasks
POST   /create_task.php         - Create new task
GET    /task_detail.php?id=:id  - Get task details
POST   /update_task.php         - Update task
POST   /delete_task.php         - Delete task
```

### Approvals
```
GET    /approvals.php           - List all approvals
POST   /approvals.php           - Submit/manage approvals
```

### Resources
```
GET    /resources.php           - List all resources
POST   /resources.php           - Create/manage resources
POST   /set_resource_distribution.php - Assign resources
```

### Users & Profile
```
GET    /users.php               - List users
POST   /update_profile.php      - Update user profile
POST   /upload_avatar.php       - Upload user avatar
```

### Notifications
```
GET    /notifications.php       - Get notifications
```

### Reports & Settings
```
GET    /reports.php             - Generate reports
GET    /settings.php            - App settings
GET    /dashboard.php           - Dashboard data
```

## Folder Structure

```
.
├── backend/                     # PHP API
│   ├── *.php                    # API endpoints
│   ├── config.php               # Configuration
│   ├── database.sql             # Database schema
│   ├── full_schema.sql          # Full schema
│   ├── uploads/
│   │   └── avatars/             # User avatar storage
│   └── README.md
│
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/           # Admin components
│   │   │   ├── approvals/       # Approval workflow components
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── layout/          # Layout components
│   │   │   ├── resources/       # Resource components
│   │   │   ├── tasks/           # Task components
│   │   │   └── ui/              # UI components (shadcn)
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── docs/                        # Documentation
│   └── *.mmd                    # Architecture diagrams
│
└── README.md
```

## Sample Data

The application now uses a minimal baseline dataset:

- **2 Users**: Admin + one member
- **2 Tasks**: one pending and one in-progress
- **1 Approval**: pending request
- **2 Resources**: one available and one assigned
- **1 Notification** and **1 Activity**

**Default Login Credentials:**
```
Email: admin@flowstone.com
Password: password123
```

## Development

### Frontend Setup

```bash
cd frontend
npm install
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Setup

```bash
# PHP server (if not using Apache/Nginx)
cd backend
php -S localhost:8000

# Or use your existing web server configuration
```

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author / Contact

**Nirjar Goswami**
- GitHub: [Nirjar26](https://github.com/Nirjar26)

**This project is Associated With my University (CHARUSAT)**

---

**SmartFlow** • Task & Resource Management Platform • Built with React, TypeScript, Tailwind CSS, and PostgreSQL
