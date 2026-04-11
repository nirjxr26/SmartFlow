import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ApprovalCard, ApprovalStatus } from "@/components/approvals/ApprovalCard";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

interface Approval {
  id: number;
  type: string;
  requestedBy: {
    id: number;
    name: string;
    department: string;
  };
  date: string;
  createdDate?: string;
  description: string;
  status: ApprovalStatus;
  canModify?: boolean;
}

export default function Approvals() {
  const [currentUser, setCurrentUser] = useState<{ id: number; role?: string; department?: string }>({ id: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApprovalId, setEditingApprovalId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [createForm, setCreateForm] = useState({
    type: "",
    department: "",
    description: "",
    status: "pending",
  });
  const [editForm, setEditForm] = useState({
    type: "",
    department: "",
    description: "",
    status: "pending",
  });

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
      setIsAdmin((user.role || '').toLowerCase().includes('admin'));
      setCreateForm((prev) => ({ ...prev, department: user.department || prev.department }));
    } catch {
      setCurrentUser({ id: 0 });
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [activeTab, currentUser.id]);

  const fetchApprovals = async () => {
    if (!currentUser.id) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        user_id: String(currentUser.id),
      });

      const response = await fetch(`http://localhost:8000/backend/approvals.php?${params.toString()}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();

      if (data.success) {
        setApprovals(data.approvals);
        setCounts(data.counts);
        setIsAdmin(Boolean(data.canReview));
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApproval = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.type.trim() || !createForm.description.trim()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Type and description are required',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:8000/backend/approvals.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          type: createForm.type,
          department: createForm.department,
          description: createForm.description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await Swal.fire({
          title: 'Request Created',
          text: 'Approval request has been submitted.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });

        setCreateForm((prev) => ({
          type: '',
          department: prev.department,
          description: '',
          status: 'pending',
        }));
        setIsCreateModalOpen(false);
        setActiveTab('pending');
        fetchApprovals();
      } else {
        Swal.fire({
          title: 'Error',
          text: data.message || 'Failed to create approval request',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to create approval request:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to create approval request',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!isAdmin) return;

    const result = await Swal.fire({
      title: 'Approve Request?',
      text: 'Are you sure you want to approve this request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, approve it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('http://localhost:8000/backend/approvals.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || '',
          },
          body: JSON.stringify({ id, action: 'approve', user_id: currentUser.id }),
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            title: 'Approved!',
            text: 'The request has been approved.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            timer: 1500,
          });
          fetchApprovals();
        } else {
          Swal.fire({
            title: 'Error',
            text: data.message || 'Failed to approve request',
            icon: 'error',
            confirmButtonColor: '#3b82f6',
          });
        }
      } catch (error) {
        console.error('Failed to approve:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to approve request',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const handleReject = async (id: number) => {
    if (!isAdmin) return;

    const result = await Swal.fire({
      title: 'Reject Request?',
      text: 'Are you sure you want to reject this request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, reject it',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('http://localhost:8000/backend/approvals.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || '',
          },
          body: JSON.stringify({ id, action: 'reject', user_id: currentUser.id }),
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            title: 'Rejected',
            text: 'The request has been rejected.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            timer: 1500,
          });
          fetchApprovals();
        } else {
          Swal.fire({
            title: 'Error',
            text: data.message || 'Failed to reject request',
            icon: 'error',
            confirmButtonColor: '#3b82f6',
          });
        }
      } catch (error) {
        console.error('Failed to reject:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to reject request',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const openEditModal = (approval: Approval) => {
    setEditingApprovalId(approval.id);
    setEditForm({
      type: approval.type,
      department: approval.requestedBy.department || "",
      description: approval.description,
      status: approval.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditApproval = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingApprovalId) return;
    if (!editForm.type.trim() || !editForm.description.trim()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Type and description are required',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsEditing(true);
    try {
      const response = await fetch('http://localhost:8000/backend/approvals.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          id: editingApprovalId,
          action: 'modify',
          type: editForm.type,
          department: editForm.department,
          description: editForm.description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await Swal.fire({
          title: 'Updated',
          text: 'Approval request updated successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
        setIsEditModalOpen(false);
        setEditingApprovalId(null);
        fetchApprovals();
      } else {
        Swal.fire({
          title: 'Error',
          text: data.message || 'Failed to update approval request',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to update approval request:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update approval request',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const tabs = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  const typeOptions = useMemo(
    () => Array.from(new Set(approvals.map((approval) => approval.type))).filter(Boolean),
    [approvals]
  );

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          approvals
            .map((approval) => approval.requestedBy.department)
            .filter((department) => Boolean(department && department.trim()))
        )
      ),
    [approvals]
  );

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const searchText = `${approval.type} ${approval.description} ${approval.requestedBy.name} ${approval.requestedBy.department}`.toLowerCase();
      const matchesSearch = !searchQuery.trim() || searchText.includes(searchQuery.toLowerCase());
      const matchesType = !typeFilter || approval.type === typeFilter;
      const matchesDepartment = !departmentFilter || approval.requestedBy.department === departmentFilter;
      const matchesDate = !createdDateFilter || approval.createdDate === createdDateFilter;

      return matchesSearch && matchesType && matchesDepartment && matchesDate;
    });
  }, [approvals, searchQuery, typeFilter, departmentFilter, createdDateFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setDepartmentFilter("");
    setCreatedDateFilter("");
  };

  return (
    <AppLayout title="Approvals" subtitle="Review and manage pending approval requests.">
      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Create Approval Request</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApproval} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                  <input
                    type="text"
                    value={createForm.type}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                    placeholder="e.g. Budget Request"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="Department"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Requested By (auto)</label>
                  <input
                    type="text"
                    value={String(currentUser.id || '')}
                    disabled
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status (auto)</label>
                  <input
                    type="text"
                    value={createForm.status}
                    disabled
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Approved By (set on review)</label>
                  <input
                    type="text"
                    value="Auto after admin review"
                    disabled
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Approved At (set on review)</label>
                  <input
                    type="text"
                    value="Auto after admin review"
                    disabled
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the approval request"
                  rows={4}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !currentUser.id}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isCreating ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Modify Approval Request</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditApproval} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                  <input
                    type="text"
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status (locked while pending)</label>
                  <input
                    type="text"
                    value={editForm.status}
                    disabled
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing || !currentUser.id}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isEditing ? 'Updating...' : 'Update Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ApprovalStatus)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </span>
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!currentUser.id}
          className="mb-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:brightness-110 transition disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Create Approval
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-card/50 p-4 md:grid-cols-5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search approvals..."
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        >
          <option value="">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        >
          <option value="">All Departments</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={createdDateFilter}
          onChange={(e) => setCreatedDateFilter(e.target.value)}
          className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        />

        <button
          type="button"
          onClick={clearFilters}
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Approvals Grid */}
      {!isLoading && filteredApprovals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredApprovals.map((approval, index) => (
            <ApprovalCard
              key={approval.id}
              {...approval}
              delay={index * 0.1}
              canModify={Boolean(approval.canModify)}
              onEdit={approval.canModify ? () => openEditModal(approval) : undefined}
              onApprove={isAdmin && (approval.status === 'pending' || approval.status === 'rejected') ? () => handleApprove(approval.id) : undefined}
              onReject={isAdmin && (approval.status === 'pending' || approval.status === 'approved') ? () => handleReject(approval.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredApprovals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No {activeTab} requests
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {activeTab === "pending"
              ? "All caught up! There are no pending approval requests."
              : `There are no ${activeTab} requests to display.`}
          </p>
        </motion.div>
      )}
    </AppLayout>
  );
}