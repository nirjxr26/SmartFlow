-- Complete FlowStone Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS flowstone_db;
USE flowstone_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100),
    department VARCHAR(100),
    bio TEXT,
    avatar VARCHAR(500),
    preferences JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in-progress', 'review', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assignee_id INT,
    created_by INT NOT NULL,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type ENUM('pdf', 'image', 'doc', 'other') DEFAULT 'other',
    file_size VARCHAR(50),
    file_path VARCHAR(500),
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    requested_by INT NOT NULL,
    department VARCHAR(100),
    description TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('device', 'software', 'room', 'equipment') NOT NULL,
    status ENUM('available', 'assigned', 'maintenance') DEFAULT 'available',
    assigned_to INT,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('success', 'warning', 'info', 'task') DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activities table for activity feed
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('task_completed', 'task_assigned', 'approval_requested', 'resource_booked', 'comment_added', 'status_changed') NOT NULL,
    description TEXT NOT NULL,
    related_id INT,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample users
-- Clear existing data in correct order (respecting foreign key constraints)
DELETE FROM activities;
DELETE FROM notifications;
DELETE FROM task_attachments;
DELETE FROM task_comments;
DELETE FROM tasks;
DELETE FROM resources;
DELETE FROM approvals;
DELETE FROM users WHERE id <= 5;

INSERT INTO users (id, email, password, name, role, department, phone) VALUES 
(1, 'admin@flowstone.com', '$2y$10$WjepPdIKACa9WfN9mjHCBeujj7DHWC4rBvWkO/a99ts0xYeZyX8R.', 'Alex Johnson', 'Administrator', 'Management', '+1-555-0100'),
(2, 'sarah@flowstone.com', '$2y$10$WjepPdIKACa9WfN9mjHCBeujj7DHWC4rBvWkO/a99ts0xYeZyX8R.', 'Sarah Chen', 'Marketing Manager', 'Marketing', '+1-555-0101'),
(3, 'mike@flowstone.com', '$2y$10$WjepPdIKACa9WfN9mjHCBeujj7DHWC4rBvWkO/a99ts0xYeZyX8R.', 'Mike Johnson', 'Senior Engineer', 'Engineering', '+1-555-0102'),
(4, 'emily@flowstone.com', '$2y$10$WjepPdIKACa9WfN9mjHCBeujj7DHWC4rBvWkO/a99ts0xYeZyX8R.', 'Emily Davis', 'Lead Designer', 'Design', '+1-555-0103'),
(5, 'david@flowstone.com', '$2y$10$WjepPdIKACa9WfN9mjHCBeujj7DHWC4rBvWkO/a99ts0xYeZyX8R.', 'David Wilson', 'Sales Manager', 'Sales', '+1-555-0104');

-- Reset auto increment
ALTER TABLE users AUTO_INCREMENT = 6;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, assignee_id, created_by, deadline) VALUES
('Q4 Marketing Campaign Review', 'Review and approve the marketing campaign materials for Q4 product launch, including social media assets and email templates.', 'in-progress', 'high', 2, 1, '2024-12-20'),
('Security Audit Documentation', 'Complete the security audit documentation for the annual compliance review.', 'pending', 'high', 3, 1, '2024-12-25'),
('Employee Onboarding Process', 'Design and implement the new employee onboarding workflow for the HR department.', 'review', 'medium', 4, 1, '2024-12-22'),
('Database Optimization', 'Optimize database queries for the reporting module to improve performance.', 'completed', 'medium', 3, 1, '2024-12-15'),
('UI/UX Design Review', 'Review the new dashboard designs and provide feedback for the development team.', 'in-progress', 'low', 4, 1, '2024-12-28'),
('API Integration Testing', 'Test the new payment gateway API integration with all edge cases.', 'pending', 'high', 3, 1, '2024-12-30');

-- Insert sample approvals
INSERT INTO approvals (type, requested_by, department, description, status) VALUES
('Budget Request', 2, 'Marketing', 'Request for additional Q4 marketing budget allocation for social media campaigns and influencer partnerships.', 'pending'),
('Leave Request', 3, 'Engineering', 'Annual leave request for December 23-27, 2024 for holiday travel.', 'pending'),
('Equipment Purchase', 4, 'Design', 'Request to purchase new design workstation and Adobe Creative Cloud subscription.', 'pending'),
('Travel Expense', 5, 'Sales', 'Reimbursement request for client meeting travel expenses in New York.', 'approved'),
('Software License', 4, 'Design', 'Request for Figma Enterprise license upgrade for the product team.', 'approved'),
('Overtime Request', 3, 'Engineering', 'Overtime approval for system maintenance scheduled for this weekend.', 'rejected');

-- Insert sample resources
INSERT INTO resources (name, type, status, assigned_to, location, description) VALUES
('MacBook Pro 16"', 'device', 'assigned', 2, 'Building A, Floor 3', 'High-performance laptop for development and design work'),
('Adobe Creative Suite', 'software', 'assigned', 4, NULL, 'Complete Adobe Creative Cloud subscription'),
('Conference Room A', 'room', 'available', NULL, 'Building A, Floor 2', 'Large conference room with projector and whiteboard'),
('4K Projector', 'equipment', 'available', NULL, 'Equipment Room', 'Professional 4K projector for presentations'),
('Dell Monitor 27"', 'device', 'maintenance', NULL, 'IT Department', '27-inch 4K monitor currently under maintenance'),
('Slack Enterprise', 'software', 'assigned', NULL, NULL, 'Team communication platform for all staff'),
('Meeting Room B', 'room', 'assigned', 3, 'Building B, Floor 1', 'Small meeting room for team discussions'),
('Video Camera Kit', 'equipment', 'available', NULL, 'Media Room', 'Professional video recording equipment');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
(1, 'success', 'Task Completed', 'Q4 Marketing Campaign Review has been marked as complete.', 0),
(1, 'task', 'New Task Assigned', 'You have been assigned to Security Audit Documentation.', 0),
(1, 'warning', 'Approval Pending', 'Budget Request from Marketing is awaiting your approval.', 0),
(1, 'info', 'Resource Booked', 'Conference Room A has been booked for Dec 20, 2024.', 1),
(1, 'success', 'Request Approved', 'Your travel expense request has been approved.', 1),
(1, 'task', 'Task Due Tomorrow', 'Database Optimization is due tomorrow.', 1),
(1, 'info', 'System Update', 'System maintenance scheduled for this weekend.', 1);

-- Insert sample activities
INSERT INTO activities (user_id, type, description, related_id, related_type) VALUES
(2, 'task_completed', 'completed Database Optimization', 4, 'task'),
(1, 'task_assigned', 'assigned Security Audit Documentation to Mike Johnson', 2, 'task'),
(2, 'approval_requested', 'requested approval for Budget Request', 1, 'approval'),
(4, 'resource_booked', 'booked Conference Room A', 3, 'resource'),
(3, 'comment_added', 'commented on Q4 Marketing Campaign Review', 1, 'task'),
(1, 'status_changed', 'changed Employee Onboarding Process to review', 3, 'task'),
(5, 'task_completed', 'completed API Integration Testing', 6, 'task'),
(2, 'comment_added', 'commented on UI/UX Design Review', 5, 'task');
