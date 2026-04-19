import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  UserCog,
  UserPlus,
  Users,
  Wrench,
  X,
  Trash2,
} from "lucide-react";
import { AdminStatCard } from "./AdminStatCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface User {
  id: number;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
}

interface Task {
  id: number;
  title: string;
  status: "pending" | "in-progress" | "review" | "completed";
  priority: "low" | "medium" | "high";
  assignee: {
    id: number | null;
    name: string;
    email: string | null;
  };
  deadline: string | null;
}

interface Approval {
  id: number;
  type: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: {
    name: string;
    department: string | null;
  };
  date: string;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  status: "available" | "assigned" | "maintenance";
}

interface NotificationsResponse {
  unreadCount: number;
}

type TaskStatus = Task["status"];
type ApprovalStatus = Approval["status"];
type ResourceStatus = Resource["status"];
type PopupKind = "users" | "tasks" | "approvals" | "resources";

const PREVIEW_LIMIT = 20;
const PAGE_SIZE = 10;
const USER_ROLE_OPTIONS = ["User", "Administrator", "HR", "Executive", "Manager", "Team Lead"];

const canManageUsersRole = (role?: string | null) => {
  const normalized = (role || "").toLowerCase();
  return normalized.includes("admin") || normalized.includes("hr") || normalized.includes("executive");
};

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popupKind, setPopupKind] = useState<PopupKind | null>(null);
  const [popupPage, setPopupPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    department: "",
  });
  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    department: "",
  });

  const getAuthHeaders = () => ({
    Authorization: localStorage.getItem("token") || "",
  });

  const openEditUser = (user: User) => {
    setUserActionError(null);
    setEditUserError(null);
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role || "User",
      department: user.department || "",
    });
  };

  const closeEditUser = () => {
    setEditingUser(null);
    setEditUserError(null);
    setIsUpdatingUser(false);
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditUserError(null);

    if (!editingUser || !currentUserId) {
      setEditUserError("Unable to resolve the user being edited.");
      return;
    }

    setIsUpdatingUser(true);
    try {
      const response = await fetch("http://localhost:8000/backend/users/users.php", {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUserId,
          id: editingUser.id,
          name: editUser.name.trim(),
          email: editUser.email.trim(),
          password: editUser.password,
          role: editUser.role.trim(),
          department: editUser.department.trim(),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Unable to update user");
      }

      closeEditUser();
      await fetchAll();
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update user";
      setEditUserError(message);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    setUserActionError(null);

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = Number(storedUser?.id || 0);
      setCurrentUserId(userId);
      setCurrentUserRole(String(storedUser?.role || ""));

      const [usersRes, tasksRes, approvalsRes, resourcesRes, notificationsRes] =
        await Promise.all([
          fetch(`http://localhost:8000/backend/users/users.php?user_id=${userId}`, { headers: getAuthHeaders() }),
          fetch("http://localhost:8000/backend/tasks/tasks.php", { headers: getAuthHeaders() }),
          fetch(`http://localhost:8000/backend/approvals/approvals.php?user_id=${userId || 1}`, { headers: getAuthHeaders() }),
          fetch(`http://localhost:8000/backend/resources/resources.php?user_id=${userId || 1}`, { headers: getAuthHeaders() }),
          fetch(
            `http://localhost:8000/backend/notifications/notifications.php?userId=${userId || 1}&filter=unread`,
            { headers: getAuthHeaders() }
          ),
        ]);

      const [
        usersData,
        tasksData,
        approvalsData,
        resourcesData,
        notificationsData,
      ] = await Promise.all([
        usersRes.json(),
        tasksRes.json(),
        approvalsRes.json(),
        resourcesRes.json(),
        notificationsRes.json(),
      ]);

      if (!usersData.success || !tasksData.success || !approvalsData.success || !resourcesData.success) {
        throw new Error("Some admin data failed to load");
      }

      // Keep IDs in consistent ascending order across all admin tables.
      setUsers([...(usersData.users || [])].sort((a: User, b: User) => a.id - b.id));
      setTasks([...(tasksData.tasks || [])].sort((a: Task, b: Task) => a.id - b.id));
      setApprovals([...(approvalsData.approvals || [])].sort((a: Approval, b: Approval) => a.id - b.id));
      setResources([...(resourcesData.resources || [])].sort((a: Resource, b: Resource) => a.id - b.id));
      setUnreadCount((notificationsData as NotificationsResponse).unreadCount || 0);
    } catch (loadError) {
      console.error("Failed to load admin data:", loadError);
      setError("Unable to load admin panel data. Please check API/server status.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserActionError(null);

    if (!currentUserId) {
      setUserActionError("Unable to resolve current user ID.");
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch("http://localhost:8000/backend/users/users.php", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUserId,
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          role: newUser.role.trim(),
          department: newUser.department.trim(),
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Unable to create user");
      }

      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "User",
        department: "",
      });

      await fetchAll();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "Failed to create user";
      setUserActionError(message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setUserActionError(null);

    if (!currentUserId) {
      setUserActionError("Unable to resolve current user ID.");
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch("http://localhost:8000/backend/users/users.php", {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUserId,
          id: userId,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Unable to delete user");
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete user";
      setUserActionError(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const canManageUsers = canManageUsersRole(currentUserRole);

  const stats = useMemo(() => {
    const admins = users.filter((user) =>
      (user.role || "").toLowerCase().includes("admin")
    ).length;

    const activeTasks = tasks.filter((task) => task.status !== "completed").length;
    const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;
    const availableResources = resources.filter((resource) => resource.status === "available").length;

    const taskStatusCounts = tasks.reduce<Record<TaskStatus, number>>(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      {
        pending: 0,
        "in-progress": 0,
        review: 0,
        completed: 0,
      }
    );

    const approvalStatusCounts = approvals.reduce<Record<ApprovalStatus, number>>(
      (acc, approval) => {
        acc[approval.status] += 1;
        return acc;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );

    const resourceStatusCounts = resources.reduce<Record<ResourceStatus, number>>(
      (acc, resource) => {
        acc[resource.status] += 1;
        return acc;
      },
      {
        available: 0,
        assigned: 0,
        maintenance: 0,
      }
    );

    return {
      admins,
      activeTasks,
      pendingApprovals,
      availableResources,
      taskStatusCounts,
      approvalStatusCounts,
      resourceStatusCounts,
    };
  }, [users, tasks, approvals, resources]);

  const openPopup = (kind: PopupKind) => {
    const sourceItems =
      kind === "users"
        ? users
        : kind === "tasks"
        ? tasks
        : kind === "approvals"
        ? approvals
        : resources;

    const startPage = Math.min(
      Math.max(1, Math.ceil(sourceItems.length / PAGE_SIZE)),
      Math.floor(PREVIEW_LIMIT / PAGE_SIZE) + 1
    );

    setPopupKind(kind);
    setPopupPage(startPage);
  };

  const closePopup = () => {
    setPopupKind(null);
    setPopupPage(1);
  };

  const popupItems = useMemo(() => {
    if (popupKind === "users") return users;
    if (popupKind === "tasks") return tasks;
    if (popupKind === "approvals") return approvals;
    if (popupKind === "resources") return resources;
    return [];
  }, [popupKind, users, tasks, approvals, resources]);

  const popupTitle =
    popupKind === "users"
      ? canManageUsers
        ? "Create User"
        : "All Users"
      : popupKind === "tasks"
      ? "All Tasks"
      : popupKind === "approvals"
      ? "All Approvals"
      : popupKind === "resources"
      ? "All Resources"
      : "";

  const totalPopupPages = Math.max(1, Math.ceil(popupItems.length / PAGE_SIZE));
  const paginatedPopupItems = popupItems.slice((popupPage - 1) * PAGE_SIZE, popupPage * PAGE_SIZE);

  const handlePopupPrevious = () => {
    setPopupPage((prev) => Math.max(1, prev - 1));
  };

  const handlePopupNext = () => {
    setPopupPage((prev) => Math.min(totalPopupPages, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={fetchAll}
          className="btn-accent-gradient flex items-center gap-2"
          type="button"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="card-elevated p-4 border-destructive/25 bg-destructive/5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Load Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <AdminStatCard title="Total Users" value={users.length} hint="From users API" icon={Users} delay={0} tone="primary" />
        <AdminStatCard title="Administrators" value={stats.admins} hint="Role includes admin" icon={Shield} delay={0.05} tone="accent" />
        <AdminStatCard title="Active Tasks" value={stats.activeTasks} hint="Non-completed tasks" icon={ListTodo} delay={0.1} tone="warning" />
        <AdminStatCard title="Pending Approvals" value={stats.pendingApprovals} hint="Awaiting action" icon={UserCog} delay={0.15} tone="primary" />
        <AdminStatCard title="Available Resources" value={stats.availableResources} hint="Ready to assign" icon={Wrench} delay={0.2} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-6"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">Task Status</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-warning">{stats.taskStatusCounts.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">In Progress</p>
              <p className="text-lg font-bold text-info">{stats.taskStatusCounts["in-progress"]}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Review</p>
              <p className="text-lg font-bold text-accent">{stats.taskStatusCounts.review}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-success">{stats.taskStatusCounts.completed}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-elevated p-6"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">Approvals Status</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Pending</p>
              <p className="text-lg font-bold text-warning">{stats.approvalStatusCounts.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Approved</p>
              <p className="text-lg font-bold text-success">{stats.approvalStatusCounts.approved}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Rejected</p>
              <p className="text-lg font-bold text-destructive">{stats.approvalStatusCounts.rejected}</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unread Notifications</p>
            <p className="font-bold text-primary">{unreadCount}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <h3 className="text-base font-semibold text-foreground mb-4">Resources Status</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Available</p>
              <p className="text-lg font-bold text-success">{stats.resourceStatusCounts.available}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Assigned</p>
              <p className="text-lg font-bold text-primary">{stats.resourceStatusCounts.assigned}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground">Maintenance</p>
              <p className="text-lg font-bold text-destructive">{stats.resourceStatusCounts.maintenance}</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <p className="text-sm text-foreground">All core modules synced</p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">All Users</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{users.length} users</span>
            {canManageUsers ? (
              <button
                type="button"
                onClick={() => openPopup("users")}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                Create User
              </button>
            ) : users.length > PREVIEW_LIMIT ? (
              <button
                type="button"
                onClick={() => openPopup("users")}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                View All
              </button>
            ) : null}
          </div>
        </div>

        {userActionError && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {userActionError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-3 font-medium">ID</th>
                <th className="text-left py-2 pr-3 font-medium">Name</th>
                <th className="text-left py-2 pr-3 font-medium">Email</th>
                <th className="text-left py-2 pr-3 font-medium">Role</th>
                <th className="text-left py-2 pr-3 font-medium">Department</th>
                {canManageUsers && <th className="text-left py-2 pr-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.slice(0, PREVIEW_LIMIT).map((user) => (
                <tr key={user.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-3 text-muted-foreground">#{user.id}</td>
                  <td className="py-3 pr-3 text-foreground font-medium">{user.name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{user.email}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        (user.role || "").toLowerCase().includes("admin")
                          ? "badge-review"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {user.role || "N/A"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{user.department || "-"}</td>
                  {canManageUsers && (
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                          onClick={() => openEditUser(user)}
                          title="Edit user"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive disabled:opacity-50"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUserId || deletingUserId === user.id}
                          title={user.id === currentUserId ? "You cannot delete your own account" : "Delete user"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingUserId === user.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">All Tasks</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{tasks.length} tasks</span>
            {tasks.length > PREVIEW_LIMIT && (
              <button
                type="button"
                onClick={() => openPopup("tasks")}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                View All
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 pr-3 font-medium">ID</th>
                <th className="text-left py-2 pr-3 font-medium">Title</th>
                <th className="text-left py-2 pr-3 font-medium">Assignee</th>
                <th className="text-left py-2 pr-3 font-medium">Priority</th>
                <th className="text-left py-2 pr-3 font-medium">Status</th>
                <th className="text-left py-2 pr-3 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, PREVIEW_LIMIT).map((task) => (
                <tr key={task.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-3 text-muted-foreground">#{task.id}</td>
                  <td className="py-3 pr-3 text-foreground max-w-[300px] truncate">{task.title}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{task.assignee?.name || "Unassigned"}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        task.priority === "high"
                          ? "priority-high"
                          : task.priority === "medium"
                          ? "priority-medium"
                          : "priority-low"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        task.status === "pending"
                          ? "badge-pending"
                          : task.status === "in-progress"
                          ? "badge-progress"
                          : task.status === "review"
                          ? "badge-review"
                          : "badge-completed"
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">{task.deadline || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">All Approvals</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{approvals.length} approvals</span>
              {approvals.length > PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => openPopup("approvals")}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  View All
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-3 font-medium">ID</th>
                  <th className="text-left py-2 pr-3 font-medium">Type</th>
                  <th className="text-left py-2 pr-3 font-medium">Requested By</th>
                  <th className="text-left py-2 pr-3 font-medium">Department</th>
                  <th className="text-left py-2 pr-3 font-medium">Status</th>
                  <th className="text-left py-2 pr-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {approvals.slice(0, PREVIEW_LIMIT).map((approval) => (
                  <tr key={approval.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-3 text-muted-foreground">#{approval.id}</td>
                    <td className="py-3 pr-3 text-foreground">{approval.type}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{approval.requestedBy?.name || "-"}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{approval.requestedBy?.department || "-"}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          approval.status === "pending"
                            ? "badge-pending"
                            : approval.status === "approved"
                            ? "badge-completed"
                            : "badge-error"
                        }`}
                      >
                        {approval.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">{approval.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">All Resources</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{resources.length} resources</span>
              {resources.length > PREVIEW_LIMIT && (
                <button
                  type="button"
                  onClick={() => openPopup("resources")}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                >
                  View All
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 pr-3 font-medium">ID</th>
                  <th className="text-left py-2 pr-3 font-medium">Name</th>
                  <th className="text-left py-2 pr-3 font-medium">Type</th>
                  <th className="text-left py-2 pr-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {resources.slice(0, PREVIEW_LIMIT).map((resource) => (
                  <tr key={resource.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-3 text-muted-foreground">#{resource.id}</td>
                    <td className="py-3 pr-3 text-foreground">{resource.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground capitalize">{resource.type}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          resource.status === "available"
                            ? "badge-completed"
                            : resource.status === "assigned"
                            ? "badge-progress"
                            : "badge-error"
                        }`}
                      >
                        {resource.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Showing full resource inventory from API</span>
          </div> */}
        </motion.div>
      </div>

      <Dialog open={Boolean(popupKind && popupKind !== "users" && popupItems.length > PREVIEW_LIMIT)} onOpenChange={(open) => { if (!open) closePopup(); }}>
        <DialogContent className="w-[calc(100vw-2.75rem)] sm:w-full max-w-6xl h-auto max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-4 sm:px-5 py-3.5 bg-card/95 backdrop-blur-sm">
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">{popupTitle}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {popupItems.length === 0
                  ? "No records available"
                  : `Showing ${(popupPage - 1) * PAGE_SIZE + 1}-${Math.min(popupPage * PAGE_SIZE, popupItems.length)} of ${popupItems.length}`}
              </DialogDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    {popupKind === "tasks" && (
                      <>
                        <th className="text-left py-2 pr-3 font-medium">ID</th>
                        <th className="text-left py-2 pr-3 font-medium">Title</th>
                        <th className="text-left py-2 pr-3 font-medium">Assignee</th>
                        <th className="text-left py-2 pr-3 font-medium">Priority</th>
                        <th className="text-left py-2 pr-3 font-medium">Status</th>
                        <th className="text-left py-2 pr-3 font-medium">Deadline</th>
                      </>
                    )}
                    {popupKind === "approvals" && (
                      <>
                        <th className="text-left py-2 pr-3 font-medium">ID</th>
                        <th className="text-left py-2 pr-3 font-medium">Type</th>
                        <th className="text-left py-2 pr-3 font-medium">Requested By</th>
                        <th className="text-left py-2 pr-3 font-medium">Department</th>
                        <th className="text-left py-2 pr-3 font-medium">Status</th>
                        <th className="text-left py-2 pr-3 font-medium">Date</th>
                      </>
                    )}
                    {popupKind === "resources" && (
                      <>
                        <th className="text-left py-2 pr-3 font-medium">ID</th>
                        <th className="text-left py-2 pr-3 font-medium">Name</th>
                        <th className="text-left py-2 pr-3 font-medium">Type</th>
                        <th className="text-left py-2 pr-3 font-medium">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {popupKind === "tasks" && (paginatedPopupItems as Task[]).map((task) => (
                    <tr key={task.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-3 text-muted-foreground">#{task.id}</td>
                      <td className="py-3 pr-3 text-foreground max-w-[320px] truncate">{task.title}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{task.assignee?.name || "Unassigned"}</td>
                      <td className="py-3 pr-3 text-muted-foreground capitalize">{task.priority}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{task.status}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{task.deadline || "-"}</td>
                    </tr>
                  ))}

                  {popupKind === "approvals" && (paginatedPopupItems as Approval[]).map((approval) => (
                    <tr key={approval.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-3 text-muted-foreground">#{approval.id}</td>
                      <td className="py-3 pr-3 text-foreground">{approval.type}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{approval.requestedBy?.name || "-"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{approval.requestedBy?.department || "-"}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{approval.status}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{approval.date}</td>
                    </tr>
                  ))}

                  {popupKind === "resources" && (paginatedPopupItems as Resource[]).map((resource) => (
                    <tr key={resource.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-3 text-muted-foreground">#{resource.id}</td>
                      <td className="py-3 pr-3 text-foreground">{resource.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground capitalize">{resource.type}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{resource.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          {popupItems.length > PREVIEW_LIMIT && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <span className="text-xs text-muted-foreground">
                Showing {paginatedPopupItems.length} of {popupItems.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePopupPrevious}
                  disabled={popupPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={handlePopupNext}
                  disabled={popupPage >= totalPopupPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={popupKind === "users"} onOpenChange={(open) => { if (!open) closePopup(); }}>
              <DialogContent className="w-[calc(100vw-2.75rem)] sm:w-full max-w-xl h-auto max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden p-0">
                <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-4 sm:px-5 py-3.5 flex items-center justify-between rounded-t-2xl">
                  <DialogHeader className="text-left space-y-0">
                    <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">Create User</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Add a new user account for the system.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
                  {userActionError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {userActionError}
                    </div>
                  )}

                  {canManageUsers && (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                          placeholder="Enter full name"
                          className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Email <span className="text-destructive">*</span></label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="Enter email address"
                          className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Password <span className="text-destructive">*</span></label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="Enter password"
                          minLength={6}
                          className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        >
                          {USER_ROLE_OPTIONS.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {roleOption}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Department</label>
                        <input
                          type="text"
                          value={newUser.department}
                          onChange={(event) => setNewUser((prev) => ({ ...prev, department: event.target.value }))}
                          placeholder="Enter department"
                          className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        />
                      </div>
                    </>
                  )}

                  <div className="border-t border-border pt-4">
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 justify-end">
                      <button
                        type="button"
                        onClick={closePopup}
                        className="w-full sm:w-auto px-6 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingUser ? "Creating..." : "Create User"}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => { if (!open) closeEditUser(); }}>
              <DialogContent className="w-[calc(100vw-2.75rem)] sm:w-full max-w-xl h-auto max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden p-0">
                <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-4 sm:px-5 py-3.5 flex items-center justify-between rounded-t-2xl">
                  <DialogHeader className="text-left space-y-0">
                    <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">Edit User</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Update the selected user account. Leave the password blank to keep the current one.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <form onSubmit={handleUpdateUser} className="p-4 sm:p-5 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
                  {editUserError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {editUserError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={editUser.name}
                      onChange={(event) => setEditUser((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Enter full name"
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Email <span className="text-destructive">*</span></label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(event) => setEditUser((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="Enter email address"
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Password</label>
                    <input
                      type="password"
                      value={editUser.password}
                      onChange={(event) => setEditUser((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="New password (optional)"
                      minLength={6}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Role</label>
                    <select
                      value={editUser.role}
                      onChange={(event) => setEditUser((prev) => ({ ...prev, role: event.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    >
                      {USER_ROLE_OPTIONS.map((roleOption) => (
                        <option key={roleOption} value={roleOption}>
                          {roleOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Department</label>
                    <input
                      type="text"
                      value={editUser.department}
                      onChange={(event) => setEditUser((prev) => ({ ...prev, department: event.target.value }))}
                      placeholder="Enter department"
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 justify-end">
                      <button
                        type="button"
                        onClick={closeEditUser}
                        className="w-full sm:w-auto px-6 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingUser}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingUser ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              </DialogContent>
      </Dialog>

    </div>
  );
}

