import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, SlidersHorizontal } from "lucide-react";
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

type ApprovalTab = ApprovalStatus | "all";

export default function Approvals() {
  const [currentUser, setCurrentUser] = useState<{ id: number; role?: string; department?: string }>({ id: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<ApprovalTab>("pending");
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [draftTypeFilter, setDraftTypeFilter] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState<ApprovalTab>("pending");
  const [draftDepartmentFilter, setDraftDepartmentFilter] = useState("");
  const [draftCreatedDateFilter, setDraftCreatedDateFilter] = useState("");
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
        user_id: String(currentUser.id),
      });
      if (activeTab !== "all") {
        params.append("status", activeTab);
      }

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

  const handleSetPending = async (id: number) => {
    if (!isAdmin) return;

    const result = await Swal.fire({
      title: 'Move Back to Pending?',
      text: 'This approval will be moved back to pending review.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, move to pending',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch('http://localhost:8000/backend/approvals.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({ id, action: 'pending', user_id: currentUser.id }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: 'Moved',
          text: 'Approval moved back to pending.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
        fetchApprovals();
      } else {
        Swal.fire({
          title: 'Error',
          text: data.message || 'Failed to move approval to pending',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to move approval to pending:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to move approval to pending',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleDeleteApproval = async (id: number) => {
    if (!isAdmin) return;

    const result = await Swal.fire({
      title: 'Delete Approval?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch('http://localhost:8000/backend/approvals.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({ id, user_id: currentUser.id }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: 'Deleted',
          text: 'Approval deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
        fetchApprovals();
      } else {
        Swal.fire({
          title: 'Error',
          text: data.message || 'Failed to delete approval',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    } catch (error) {
      console.error('Failed to delete approval:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete approval',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
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
    { key: "all", label: "All", count: counts.pending + counts.approved + counts.rejected },
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

  const handleOpenFilterPanel = () => {
    setDraftStatusFilter(activeTab);
    setDraftTypeFilter(typeFilter);
    setDraftDepartmentFilter(departmentFilter);
    setDraftCreatedDateFilter(createdDateFilter);
    setIsFilterPanelOpen(true);
  };

  const handleApplyFilters = () => {
    setActiveTab(draftStatusFilter);
    setTypeFilter(draftTypeFilter);
    setDepartmentFilter(draftDepartmentFilter);
    setCreatedDateFilter(draftCreatedDateFilter);
    setIsFilterPanelOpen(false);
  };

  const handleResetFilters = () => {
    setDraftStatusFilter("pending");
    setDraftTypeFilter("");
    setDraftDepartmentFilter("");
    setDraftCreatedDateFilter("");
    setActiveTab("pending");
    setTypeFilter("");
    setDepartmentFilter("");
    setCreatedDateFilter("");
    setIsFilterPanelOpen(false);
  };

  return (
    <AppLayout title="Approvals" subtitle="Review and manage pending approval requests.">
      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Create Approval Request</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApproval} className="space-y-4 px-4 sm:px-6 py-5 overflow-y-auto">
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

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted"
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
          <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Modify Approval Request</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditApproval} className="space-y-4 px-4 sm:px-6 py-5 overflow-y-auto">
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

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted"
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

      {/* Search + Actions */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative min-w-0 flex flex-1 w-full sm:w-auto items-center gap-2 flex-nowrap sm:flex-wrap">
          <div className="relative min-w-0 flex-1 w-full sm:w-auto sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approvals..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border/80 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenFilterPanel}
            className={cn(
              "h-10 w-10 shrink-0 rounded-xl border border-border/70 bg-card text-muted-foreground flex items-center justify-center transition-all duration-200",
              "hover:text-foreground hover:border-border hover:bg-muted/40",
              isFilterPanelOpen && "text-primary border-primary/40 bg-primary/10"
            )}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex basis-full order-3 items-center gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ApprovalTab)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    activeTab === tab.key
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isFilterPanelOpen && (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="fixed inset-0 z-30 bg-black/10"
                  aria-label="Close filters"
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-2 z-40 w-[min(100%,24rem)] rounded-2xl border border-border/70 bg-card shadow-xl"
                >
                  <div className="p-4 sm:p-5 space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Status</h3>
                      <select
                        value={draftStatusFilter}
                        onChange={(e) => setDraftStatusFilter(e.target.value as ApprovalTab)}
                        className="mt-3 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40"
                      >
                        {tabs.map((tab) => (
                          <option key={tab.key} value={tab.key}>
                            {tab.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-px bg-border/60" />

                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Type</h3>
                      <select
                        value={draftTypeFilter}
                        onChange={(e) => setDraftTypeFilter(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40"
                      >
                        <option value="">All Types</option>
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-px bg-border/60" />

                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Department</h3>
                      <select
                        value={draftDepartmentFilter}
                        onChange={(e) => setDraftDepartmentFilter(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40"
                      >
                        <option value="">All Departments</option>
                        {departmentOptions.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-px bg-border/60" />

                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Date Filter</h3>
                      <input
                        type="date"
                        value={draftCreatedDateFilter}
                        onChange={(e) => setDraftCreatedDateFilter(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/60 px-4 sm:px-5 py-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!currentUser.id}
            className="btn-primary-gradient h-10 w-10 sm:w-auto sm:px-4 shrink-0 sm:ml-auto sm:order-2 flex items-center justify-center gap-2 text-white"
            aria-label="Create approval"
            title="Create approval"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Create Approval</span>
          </motion.button>
        </div>
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
              onPending={isAdmin && (approval.status === 'approved' || approval.status === 'rejected') ? () => handleSetPending(approval.id) : undefined}
              onDelete={isAdmin && (approval.status === 'approved' || approval.status === 'rejected') ? () => handleDeleteApproval(approval.id) : undefined}
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
            {activeTab === "all" ? "No approval requests" : `No ${activeTab} requests`}
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