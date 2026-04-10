import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Grid3X3, List, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TaskCard, TaskStatus, TaskPriority } from "@/components/tasks/TaskCard";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: { name: string; email?: string };
  createdBy?: { id: number; name: string };
  deadline: string;
  createdAt: string;
  updatedAt?: string;
  comments?: number;
  attachments?: number;
}

const statusFilters = [
  { key: "all", label: "All Tasks" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; role?: string; name?: string }>({ id: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortMode, setSortMode] = useState<"newest" | "oldest">("newest");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTasks();
  }, [activeFilter, sortMode, selectedAssigneeId, createdDateFilter]);

  useEffect(() => {
    try {
      setCurrentUser(JSON.parse(localStorage.getItem('user') || '{}'));
    } catch {
      setCurrentUser({ id: 0 });
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/backend/users.php', {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const isAdmin = (currentUser.role || '').toLowerCase().includes('admin');

  const canManageTask = (task: Task) => {
    return isAdmin || task.createdBy?.id === currentUser.id;
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('status', activeFilter);
      }
      params.append('sort', sortMode);
      if (selectedAssigneeId) {
        params.append('assignee_id', selectedAssigneeId);
      }
      if (createdDateFilter) {
        params.append('created_date', createdDateFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`http://localhost:8000/backend/tasks.php?${params.toString()}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();

      if (data.success) {
        setTasks(data.tasks);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'Failed to load tasks',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to load tasks. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTasks();
  };

  const handleSortChange = (mode: "newest" | "oldest") => {
    setSortMode(mode);
  };

  const handleAssigneeChange = (value: string) => {
    setSelectedAssigneeId(value);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleTaskClick = async (task: Task) => {
    try {
      const response = await fetch(`http://localhost:8000/backend/task_detail.php?id=${task.id}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedTask(data.task);
        setIsModalOpen(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load task details',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to load task details. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleDataUpdate = (taskId: number, commentsCount: number, attachmentsCount: number) => {
    // Update the tasks list with new counts
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, comments: commentsCount, attachments: attachmentsCount }
          : task
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTaskUpdate = async (taskId: number, updates: any) => {
    try {
      const response = await fetch('http://localhost:8000/backend/update_task.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({ id: taskId, user_id: currentUser.id, ...updates }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Task Updated!',
          text: 'Task has been updated successfully.',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
        fetchTasks();
        setIsModalOpen(false);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: data.message || 'Failed to update task',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to update task. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/delete_task.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({ id: taskId, user_id: currentUser.id }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Task has been deleted successfully.',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
        fetchTasks();
        setIsModalOpen(false);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: data.message || 'Failed to delete task',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to delete task. Please try again.',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  return (
    <AppLayout title="Task Management" subtitle="Manage and track all your tasks in one place.">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      ) : (
        <>
          {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Search and Filters */}
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => handleSortChange('newest')}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                sortMode === 'newest'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('oldest')}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                sortMode === 'oldest'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Oldest
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Date Created
            </label>
            <input
              type="date"
              value={createdDateFilter}
              onChange={(e) => setCreatedDateFilter(e.target.value)}
              className="bg-transparent text-sm text-foreground focus:outline-none"
            />
            {createdDateFilter && (
              <button
                type="button"
                onClick={() => setCreatedDateFilter("")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={selectedAssigneeId}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            className="min-w-[180px] px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
          >
            <option value="">Assigned User</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle and Create */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/tasks/create')}
            className="btn-primary-gradient flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </motion.button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeFilter === filter.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Task Grid */}
      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1"
        )}
      >
        {filteredTasks.map((task, index) => (
          <TaskCard
            key={task.id}
            {...task}
            comments={task.comments}
            attachments={task.attachments}
            delay={index * 0.05}
            onClick={() => handleTaskClick(task)}
            canManage={canManageTask(task)}
            onEdit={canManageTask(task) ? () => handleEditTask(task) : undefined}
            onDelete={canManageTask(task) ? () => handleTaskDelete(task.id) : undefined}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No tasks found
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery
              ? `No tasks match "${searchQuery}". Try a different search term.`
              : "There are no tasks in this category yet."}
          </p>
        </motion.div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        onDataUpdate={handleDataUpdate}
      />

      {/* Edit Task Modal */}
      <CreateTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onTaskCreated={() => {
          fetchTasks();
        }}
        task={editingTask}
      />
        </>
      )}
    </AppLayout>
  );
}