🚀 FlowStone (SmartFlow)

Enterprise-grade team operations platform for managing tasks, approvals, resources, and workflows with a modern UI and scalable backend.

📌 Overview

FlowStone is a full-stack work management system designed to streamline organizational workflows. It provides task tracking, approval pipelines, resource allocation, analytics, and role-based administration — all in a clean, responsive interface.

✨ Key Features
🔐 Authentication & Authorization
Secure login system (email/password)
Role-based access (Admin / User)
Protected routes and session persistence
📊 Dashboard
Real-time KPI metrics
Task trends & resource usage charts
Activity feed
✅ Task Management
Create, update, delete tasks
Filter, search, and status tracking
Task detail modal view
Priority & deadline handling
📝 Approval Workflow
Approve / reject system
Status categorization (Pending, Approved, Rejected)
Confirmation dialogs
🧱 Resource Management
Add and manage resources
Status tracking and categorization
Search and filtering
📈 Reports & Analytics
Visual charts (Bar, Pie, Area)
KPI summaries
CSV export
🔔 Notifications System
Real-time notifications
Mark as read / delete
Unread filtering
⚙️ User Settings & Profile
Profile editing
Password updates
Avatar upload
Theme switching (Light/Dark)
Preferences toggles
🛡️ Admin Panel
Restricted access
System-wide insights
User and resource monitoring
🧰 Tech Stack
Frontend
React 18 + TypeScript
Vite
Tailwind CSS + shadcn/ui
Framer Motion (animations)
Recharts (analytics)
React Query (state management)
React Hook Form + Zod (validation)
Backend
PHP (REST APIs)
MySQL (PDO)
Modular API architecture
🏗️ Architecture
Frontend (React)
   ↓ API Calls
Backend (PHP REST)
   ↓
MySQL Database
Stateless API design
Client-side caching via React Query
Clean separation of concerns
⚙️ Installation & Setup
1. Clone the repository
git clone <your-repo-url>
cd FlowStone-1
2. Install frontend dependencies
npm install
npm run dev
3. Start backend server
cd backend
php -S localhost:8000
4. Setup database
php setup.php
php update_schema.php
php setup_tasks.php
5. Access the app
http://localhost:5173
🔑 Default Login
Email: admin@flowstone.com
Password: password123
📂 Project Structure
FlowStone/
│
├── src/
│   ├── pages/ (Dashboard, Tasks, Approvals, etc.)
│   ├── components/
│   ├── App.tsx
│   └── main.tsx
│
├── backend/
│   ├── API endpoints (PHP)
│   ├── DB setup scripts
│
├── public/
├── package.json
└── index.html
🔌 Core API Endpoints
Feature	Endpoint
Auth	login.php, register.php
Profile	profile.php, update_profile.php
Tasks	tasks.php, create_task.php, etc.
Approvals	approvals.php
Resources	resources.php
Notifications	notifications.php
Reports	reports.php
Admin	users.php, dashboard APIs
🚀 What Makes This Project Stand Out
Clean enterprise UI/UX
Full task lifecycle + approval system
Role-based architecture
Real-time analytics & dashboards
Modular PHP REST backend
Scalable and production-ready structure
🔐 Security Considerations
Uses PDO (prevents SQL injection)
Token-based authentication
CORS enabled (needs tightening for production)

Recommended improvements:

JWT with refresh tokens
HTTPS enforcement
Rate limiting & CSRF protection
📈 Future Improvements
Unit & integration testing (Vitest, RTL)
API documentation (Swagger/OpenAPI)
Real-time updates via WebSockets
Deployment pipeline (CI/CD)
Performance optimization
🤝 Contribution Guide
Fork the repo
Create a feature branch
Commit changes with clear messages
Submit a Pull Request
🧾 Summary

FlowStone is a complete enterprise workflow solution combining:

Task & approval management
Resource tracking
Analytics dashboards
Role-based control

Built with modern frontend practices and a structured backend, it reflects real-world scalable system design.