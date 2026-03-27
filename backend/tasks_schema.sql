-- Tasks Management Schema

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

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, assignee_id, created_by, deadline) VALUES
('Q4 Marketing Campaign Review', 'Review and approve the marketing campaign materials for Q4 product launch, including social media assets and email templates.', 'in-progress', 'high', 1, 1, '2024-12-20'),
('Security Audit Documentation', 'Complete the security audit documentation for the annual compliance review.', 'pending', 'high', 1, 1, '2024-12-25'),
('Employee Onboarding Process', 'Design and implement the new employee onboarding workflow for the HR department.', 'review', 'medium', 1, 1, '2024-12-22'),
('Database Optimization', 'Optimize database queries for the reporting module to improve performance.', 'completed', 'medium', 1, 1, '2024-12-15'),
('UI/UX Design Review', 'Review the new dashboard designs and provide feedback for the development team.', 'in-progress', 'low', 1, 1, '2024-12-28'),
('API Integration Testing', 'Test the new payment gateway API integration with all edge cases.', 'pending', 'high', 1, 1, '2024-12-30');

-- Insert sample comments
INSERT INTO task_comments (task_id, user_id, content) VALUES
(1, 1, 'Initial draft looks great! Just a few minor tweaks needed.'),
(1, 1, 'Thanks! I will update the banner images today.'),
(3, 1, 'Please add the benefits enrollment section.');

-- Insert sample attachments
INSERT INTO task_attachments (task_id, filename, file_type, file_size, file_path, uploaded_by) VALUES
(1, 'Campaign_Brief.pdf', 'pdf', '2.4 MB', '/uploads/campaign_brief.pdf', 1),
(1, 'Banner_v2.png', 'image', '1.8 MB', '/uploads/banner_v2.png', 1),
(3, 'Onboarding_Flow.pdf', 'pdf', '890 KB', '/uploads/onboarding_flow.pdf', 1),
(5, 'Dashboard_Mockup.pdf', 'pdf', '5.2 MB', '/uploads/dashboard_mockup.pdf', 1);
