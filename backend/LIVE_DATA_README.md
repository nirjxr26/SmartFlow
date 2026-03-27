# FlowStone Backend API - Complete Live Data Integration

## 🚀 Quick Start

### 1. Start PHP Server
```bash
cd E:\SMS\flowstone-ui\backend
php -S localhost:8000
```

### 2. Setup Database
Visit: **http://localhost:8000/setup_database.php** in your browser

The database will be automatically created with all tables and sample data.

### 3. Login
Use these credentials:
- **Email:** admin@flowstone.com
- **Password:** password123

## 📊 Live Data Features

All frontend pages now use live backend data:

✅ **Dashboard** - Real KPIs, charts, and activity feed from database
✅ **Tasks** - Full CRUD operations with live updates
✅ **Approvals** - Create, approve, reject approval requests
✅ **Resources** - Manage resources with assign/release functionality  
✅ **Notifications** - Real-time user notifications
✅ **Profile** - Live user profile management

## 🔌 API Endpoints

### Dashboard
- `GET /dashboard.php` - Get all dashboard data (KPIs, charts, activities)

### Tasks
- `GET /tasks.php?status=pending` - List tasks with filters
- `POST /create_task.php` - Create new task
- `GET /task_detail.php?id=1` - Get task details
- `POST /update_task.php` - Update task
- `DELETE /delete_task.php` - Delete task

### Approvals
- `GET /approvals.php?status=pending` - List approvals
- `POST /approvals.php` - Create approval request
- `PUT /approvals.php` - Approve/reject (action: approve or reject)

### Resources  
- `GET /resources.php?type=device&status=available` - List resources
- `POST /resources.php` - Create resource or assign/release
- `DELETE /resources.php` - Delete resource

### Notifications
- `GET /notifications.php?userId=1&filter=unread` - Get notifications
- `POST /notifications.php` - Mark as read (action: markRead/markAllRead)
- `DELETE /notifications.php` - Delete notification

### Profile
- `GET /profile.php?id=1` - Get user profile  
- `POST /update_profile.php` - Update profile

### Authentication
- `POST /login.php` - User login
- `POST /register.php` - User registration

## 📁 Files Created/Updated

### Backend Files:
- `full_schema.sql` - Complete database schema with all tables
- `setup_database.php` - Automatic database setup script
- `dashboard.php` - Dashboard statistics API
- `approvals.php` - Approvals management API
- `resources.php` - Resources management API
- `notifications.php` - Notifications API

### Frontend Files Updated:
- `Dashboard.tsx` - Now uses live API data
- `Approvals.tsx` - Full approval workflow with backend
- `Resources.tsx` - Resource management with live data
- `Notifications.tsx` - Real notifications from database
- `ActivityFeed.tsx` - Shows live activity feed

## 🗄️ Database Tables

- **users** - User accounts and profiles
- **tasks** - Task management
- **task_comments** - Comments on tasks
- **task_attachments** - File attachments
- **approvals** - Approval requests workflow
- **resources** - Resource inventory and assignments
- **notifications** - User notifications
- **activities** - System activity log

## 🎯 Sample Data Included

- 5 test users (all password: password123)
- 6 sample tasks in various states
- 6 approval requests (pending, approved, rejected)
- 8 resources (devices, software, rooms, equipment)
- 7 notifications
- 8 activity entries

## ✨ Features

- Real-time dashboard KPIs calculated from actual data
- Dynamic charts showing tasks per week and resource utilization
- Live activity feed tracking all system changes
- Complete approval workflow with notifications
- Resource booking and assignment system
- User notification management
- Profile management with all details

## 🔧 Configuration

Database settings in `config.php`:
```php
$host = 'localhost';
$dbname = 'flowstone_db';
$username = 'root';
$password = ''; // Update if needed
```

## 🌟 No More Dummy Data!

Everything is now connected to the backend:
- Dashboard statistics are calculated from real task data
- Charts show actual weekly/monthly data
- Activity feed displays real user actions
- Approvals can be approved/rejected with database updates
- Resources can be assigned and tracked
- Notifications are stored and managed in database

## 📝 Next Steps

The app is now fully functional with live data. You can:

1. ✅ Log in and see real dashboard data
2. ✅ Create, update, and delete tasks
3. ✅ Approve or reject requests
4. ✅ Manage resources and assignments
5. ✅ View and manage notifications
6. ✅ Update user profiles

All data persists in the MySQL database!
