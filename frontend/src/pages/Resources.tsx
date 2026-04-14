import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Monitor, Cpu, DoorOpen, Package, X, Filter, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ResourceCard, ResourceType, ResourceStatus } from "@/components/resources/ResourceCard";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

interface Resource {
  id: number;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  requestId?: number;
  requestedBy?: {
    id?: number;
    name: string;
    department?: string | null;
  } | null;
  requestedAt?: string | null;
  assignedTo?: { id: number; name: string };
  location?: string;
  description?: string;
}

interface UserSummary {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

interface ResourceFilterCounts {
  types: Record<string, number>;
  statuses: Record<string, number>;
}

const typeFilters = [
  { key: "all", label: "All", icon: null },
  { key: "device", label: "Devices", icon: Monitor },
  { key: "software", label: "Software", icon: Cpu },
  { key: "room", label: "Rooms", icon: DoorOpen },
  { key: "equipment", label: "Equipment", icon: Package },
];

const statusFilters = [
  { key: "available", label: "Available" },
  { key: "assigned", label: "Assigned" },
  { key: "maintenance", label: "Maintenance" },
  { key: "requested", label: "Requested" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All Status" },
];

export default function Resources() {
  const [currentUser, setCurrentUser] = useState<{ id: number; role?: string }>({ id: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [filterCounts, setFilterCounts] = useState<ResourceFilterCounts>({
    types: { all: 0, device: 0, software: 0, room: 0, equipment: 0 },
    statuses: { all: 0, available: 0, assigned: 0, maintenance: 0, requested: 0, rejected: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [isUpdatingResource, setIsUpdatingResource] = useState(false);
  const [createResourceError, setCreateResourceError] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [draftTypeFilter, setDraftTypeFilter] = useState("all");
  const [draftStatusFilter, setDraftStatusFilter] = useState("available");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "device" as ResourceType,
    location: "",
    description: "",
    status: "available" as ResourceStatus,
    assignTo: "",
  });

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
      const admin = (user.role || '').toLowerCase().includes('admin');
      setIsAdmin(admin);
      setStatusFilter(admin ? "available" : "assigned");
    } catch {
      setCurrentUser({ id: 0 });
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser.id) return;
    fetchResources();
  }, [typeFilter, statusFilter, currentUser.id]);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('user_id', String(currentUser.id));
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`http://localhost:8000/backend/resources/resources.php?${params.toString()}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();

      if (data.success) {
        setResources(data.resources);
        setUsers(data.users || []);
        setIsAdmin(Boolean(data.permissions?.isAdmin));
        if (data.filterCounts) {
          setFilterCounts(data.filterCounts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchResources();
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setCreateResourceError('Only admins can add resources');
      return;
    }

    if (!resourceForm.name.trim()) {
      setCreateResourceError("Please enter a resource name");
      return;
    }

    setCreateResourceError("");
    setIsCreatingResource(true);

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          name: resourceForm.name,
          type: resourceForm.type,
          location: resourceForm.location,
          description: resourceForm.description,
          assignTo: resourceForm.assignTo ? Number(resourceForm.assignTo) : null,
          user_id: currentUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsCreateModalOpen(false);
        setResourceForm({
          name: "",
          type: "device",
          location: "",
          description: "",
          status: "available",
          assignTo: "",
        });
        await Swal.fire({
          title: 'Success!',
          text: 'Resource added successfully',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
        fetchResources();
      } else {
        setCreateResourceError(data.message || 'Failed to add resource');
      }
    } catch (error) {
      console.error('Failed to add resource:', error);
      setCreateResourceError('Failed to add resource');
    } finally {
      setIsCreatingResource(false);
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getResourceSortWeight = (resource: Resource) => {
    if (!isAdmin) {
      if (resource.status === "assigned" && resource.assignedTo?.id === currentUser.id) return 0;
      if (resource.status === "available") return 1;
      if (resource.status === "maintenance") return 2;
      if (resource.status === "requested") return 3;
      if (resource.status === "rejected") return 4;
      return 5;
    }

    if (resource.status === "requested") return 0;
    if (resource.status === "available") return 1;
    if (resource.status === "assigned") return 2;
    if (resource.status === "maintenance") return 3;
    if (resource.status === "rejected") return 4;
    return 5;
  };

  const displayResources = [...filteredResources].sort((a, b) => {
    const weightDiff = getResourceSortWeight(a) - getResourceSortWeight(b);
    if (weightDiff !== 0) return weightDiff;
    return a.name.localeCompare(b.name);
  });

  const handleOpenFilterPanel = () => {
    setDraftTypeFilter(typeFilter);
    setDraftStatusFilter(statusFilter);
    setDraftStartDate("");
    setDraftEndDate("");
    setIsFilterPanelOpen(true);
  };

  const handleApplyFilters = () => {
    setTypeFilter(draftTypeFilter);
    setStatusFilter(draftStatusFilter);
    setIsFilterPanelOpen(false);
  };

  const handleResetFilters = () => {
    setDraftTypeFilter("all");
    setDraftStatusFilter(isAdmin ? "available" : "assigned");
    setDraftStartDate("");
    setDraftEndDate("");
    setTypeFilter("all");
    setStatusFilter(isAdmin ? "available" : "assigned");
    setIsFilterPanelOpen(false);
  };

  const openEditResourceModal = (resource: Resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      type: resource.type,
      location: resource.location || '',
      description: resource.description || '',
      status: resource.status,
      assignTo: resource.assignedTo?.id ? String(resource.assignedTo.id) : '',
    });
    setCreateResourceError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    setIsUpdatingResource(true);
    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'update_resource',
          user_id: currentUser.id,
          id: editingResource.id,
          name: resourceForm.name,
          type: resourceForm.type,
          location: resourceForm.location,
          description: resourceForm.description,
          status: resourceForm.status,
          assignTo: resourceForm.assignTo ? Number(resourceForm.assignTo) : 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditModalOpen(false);
        setEditingResource(null);
        await Swal.fire({ icon: 'success', title: 'Updated', text: 'Resource updated successfully', confirmButtonColor: '#3b82f6', timer: 1400 });
        fetchResources();
      } else {
        setCreateResourceError(data.message || 'Failed to update resource');
      }
    } catch (error) {
      console.error('Failed to update resource:', error);
      setCreateResourceError('Failed to update resource');
    } finally {
      setIsUpdatingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    const result = await Swal.fire({
      title: 'Delete this resource?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({ id: resourceId, user_id: currentUser.id }),
      });
      const data = await response.json();
      if (data.success) {
        await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Resource deleted', confirmButtonColor: '#3b82f6', timer: 1300 });
        fetchResources();
      } else {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: data.message || 'Unable to delete resource', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Failed to delete resource:', error);
      Swal.fire({ icon: 'error', title: 'Delete failed', text: 'Unable to delete resource', confirmButtonColor: '#3b82f6' });
    }
  };

  const handleRequestResource = async (resource: Resource) => {
    const confirmResult = await Swal.fire({
      title: 'Request this resource?',
      text: `Send request for ${resource.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Request',
      cancelButtonText: 'Cancel',
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'create_request',
          user_id: currentUser.id,
          resourceId: resource.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await Swal.fire({ icon: 'success', title: 'Requested', text: data.message || 'Resource requested successfully', confirmButtonColor: '#3b82f6', timer: 1300 });
        fetchResources();
      } else {
        Swal.fire({ icon: 'error', title: 'Request failed', text: data.message || 'Unable to request resource', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Failed to request resource:', error);
      Swal.fire({ icon: 'error', title: 'Request failed', text: 'Unable to request resource', confirmButtonColor: '#3b82f6' });
    }
  };

  const handleAssignResource = async (resource: Resource) => {
    if (!isAdmin) return;

    if (!users.length) {
      Swal.fire({ icon: 'warning', title: 'No users available', text: 'Add users before assigning resources.', confirmButtonColor: '#3b82f6' });
      return;
    }

    const optionsMarkup = users
      .map((user) => `<option value="${user.id}">${user.name}</option>`)
      .join('');

    const pick = await Swal.fire({
      title: 'Assign Resource',
      html: `
        <div style="text-align:left; margin-top: 0.5rem;">
          <label for="assign-user-select" style="display:block; font-size:0.875rem; font-weight:600; color:#475569; margin-bottom:0.5rem;">
            Select a user
          </label>
          <select
            id="assign-user-select"
            style="
              width:100%;
              -webkit-appearance:none;
              -moz-appearance:none;
              appearance:none;
              padding:0.75rem 2.75rem 0.75rem 0.9rem;
              border:1px solid #cbd5e1;
              border-radius:0.75rem;
              font-size:0.95rem;
              color:#0f172a;
              background:#ffffff;
              background-image:url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' fill=\'none\'%3E%3Cpath d=\'M4 6L8 10L12 6\' stroke=\'%2364748B\' stroke-width=\'1.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E');
              background-repeat:no-repeat;
              background-size:1rem 1rem;
              background-position:right 0.85rem center;
              outline:none;
            "
          >
            <option value="">Select a user</option>
            ${optionsMarkup}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Assign',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      focusConfirm: false,
      preConfirm: () => {
        const select = document.getElementById('assign-user-select') as HTMLSelectElement | null;
        const value = select?.value || '';
        if (!value) {
          Swal.showValidationMessage('Please select a user');
          return null;
        }
        return value;
      },
    });

    if (!pick.isConfirmed || !pick.value) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'assign',
          user_id: currentUser.id,
          id: resource.id,
          assignTo: Number(pick.value),
        }),
      });

      const data = await response.json();
      if (data.success) {
        await Swal.fire({ icon: 'success', title: 'Assigned', text: data.message || 'Resource assigned successfully', confirmButtonColor: '#3b82f6', timer: 1300 });
        fetchResources();
      } else {
        Swal.fire({ icon: 'error', title: 'Assign failed', text: data.message || 'Unable to assign resource', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Failed to assign resource:', error);
      Swal.fire({ icon: 'error', title: 'Assign failed', text: 'Unable to assign resource', confirmButtonColor: '#3b82f6' });
    }
  };

  const handleSetResourceAvailable = async (resource: Resource, title: string, text: string) => {
    const confirmResult = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'update_resource',
          user_id: currentUser.id,
          id: resource.id,
          name: resource.name,
          type: resource.type,
          location: resource.location || '',
          description: resource.description || '',
          status: 'available',
          assignTo: 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await Swal.fire({ icon: 'success', title: 'Updated', text: data.message || 'Resource updated', confirmButtonColor: '#3b82f6', timer: 1300 });
        fetchResources();
      } else {
        Swal.fire({ icon: 'error', title: 'Action failed', text: data.message || 'Unable to update resource', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Failed to set resource available:', error);
      Swal.fire({ icon: 'error', title: 'Action failed', text: 'Unable to update resource', confirmButtonColor: '#3b82f6' });
    }
  };

  const handleSetResourceMaintenance = async (resource: Resource) => {
    const confirmResult = await Swal.fire({
      title: 'Mark as maintenance?',
      text: `Move ${resource.name} to maintenance?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'maintenance',
          user_id: currentUser.id,
          id: resource.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await Swal.fire({ icon: 'success', title: 'Updated', text: data.message || 'Resource moved to maintenance', confirmButtonColor: '#3b82f6', timer: 1300 });
        fetchResources();
      } else {
        Swal.fire({ icon: 'error', title: 'Action failed', text: data.message || 'Unable to update resource', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Failed to set resource maintenance:', error);
      Swal.fire({ icon: 'error', title: 'Action failed', text: 'Unable to update resource', confirmButtonColor: '#3b82f6' });
    }
  };

  const handleReviewRequest = async (resource: Resource, decision: 'approve' | 'reject') => {
    if (!resource.requestId) {
      Swal.fire({ icon: 'error', title: 'Request missing', text: 'No request record was found for this resource.', confirmButtonColor: '#3b82f6' });
      return;
    }

    const confirmResult = await Swal.fire({
      title: decision === 'approve' ? 'Approve Resource?' : 'Reject Resource?',
      text: decision === 'approve'
        ? `Approve request for ${resource.name}?`
        : `Reject request for ${resource.name}?`,
      icon: decision === 'approve' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: decision === 'approve' ? '#3b82f6' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: decision === 'approve' ? 'Yes, approve' : 'Yes, reject',
      cancelButtonText: 'Cancel',
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/resources/resources.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: localStorage.getItem('token') || '',
        },
        body: JSON.stringify({
          action: 'review_request',
          user_id: currentUser.id,
          id: resource.requestId,
          decision,
        }),
      });
      const data = await response.json();
      if (data.success) {
        await Swal.fire({ icon: 'success', title: decision === 'approve' ? 'Approved' : 'Rejected', text: data.message || 'Resource updated', confirmButtonColor: '#3b82f6', timer: 1300 });
        fetchResources();
      } else {
        Swal.fire({ icon: 'error', title: 'Action failed', text: data.message || 'Unable to update resource', confirmButtonColor: '#3b82f6' });
      }
    } catch (error) {
      console.error('Failed to update resource action:', error);
      Swal.fire({ icon: 'error', title: 'Action failed', text: 'Unable to update resource', confirmButtonColor: '#3b82f6' });
    }
  };

  return (
    <AppLayout title="Resources" subtitle="Manage and allocate resources across your organization.">
      {/* Header with Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search and Filter Row */}
        <div className="relative min-w-0 flex flex-1 w-full sm:w-auto items-center gap-2 flex-nowrap sm:flex-wrap">
          {/* Search */}
          <div className="relative min-w-0 flex-1 w-full sm:w-auto sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  fetchResources();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Icon Button with Popup */}
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
            <Filter className="w-4 h-4" />
          </button>

          {/* Add Resource Button */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setCreateResourceError("");
                setResourceForm({ name: '', type: 'device', location: '', description: '', status: 'available', assignTo: '' });
                setIsCreateModalOpen(true);
              }}
              className="btn-primary-gradient h-10 w-10 sm:w-auto sm:px-4 shrink-0 sm:ml-auto flex items-center justify-center gap-2 text-white"
              aria-label="Add resource"
              title="Add resource"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Add Resource</span>
            </motion.button>
          )}

          {/* Filter Panel Dropdown */}
          <div className="relative">

            {isFilterPanelOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 w-[min(100%,24rem)] rounded-xl border border-border bg-card shadow-lg p-4 space-y-4"
              >
                  {/* Type Filter Group */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {typeFilters.map((filter) => {
                        const Icon = filter.icon;
                        return (
                          <button
                            key={filter.key}
                            onClick={() => setDraftTypeFilter(filter.key)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                              draftTypeFilter === filter.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/70"
                            )}
                          >
                            {Icon && <Icon className="w-3 h-3" />}
                            {filter.label}
                            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {filterCounts.types[filter.key] ?? 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-border/60" />

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Status</label>
                    <select
                      value={draftStatusFilter}
                      onChange={(e) => setDraftStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    >
                      {statusFilters.map((filter) => (
                        <option key={filter.key} value={filter.key}>
                          {filter.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter Group */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Date Range</label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={draftStartDate}
                        onChange={(e) => setDraftStartDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                      />
                      <input
                        type="date"
                        value={draftEndDate}
                        onChange={(e) => setDraftEndDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  {/* Apply/Reset Buttons */}
                  <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      Apply
                    </button>
                  </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Status Filter Pills Row */}
        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                statusFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {filter.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                statusFilter === filter.key
                  ? "bg-primary-foreground/20"
                  : "bg-muted text-muted-foreground"
              )}>
                {filterCounts.statuses[filter.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop for Filter Panel */}
      {isFilterPanelOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsFilterPanelOpen(false)}
        />
      )}

      {/* Create Resource Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Resource</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 px-4 sm:px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Resource Name</label>
                  <input
                    type="text"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Resource Name"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value as ResourceType }))}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  >
                    <option value="device">Device</option>
                    <option value="software">Software</option>
                    <option value="room">Room</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={resourceForm.status}
                    onChange={(e) => setResourceForm((prev) => ({ ...prev, status: e.target.value as ResourceStatus }))}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  >
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Assign To (admin)</label>
                  <select
                    value={resourceForm.assignTo}
                    onChange={(e) => setResourceForm((prev) => ({ ...prev, assignTo: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Location (optional)</label>
                <input
                  type="text"
                  value={resourceForm.location}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label>
                <textarea
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  rows={4}
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>

              {createResourceError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createResourceError}
                </div>
              )}

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
                  disabled={isCreatingResource}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isCreatingResource ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Edit Resource</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateResource} className="space-y-4 px-4 sm:px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Resource Name</label>
                  <input type="text" value={resourceForm.name} onChange={(e) => setResourceForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                  <select value={resourceForm.type} onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value as ResourceType }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
                    <option value="device">Device</option>
                    <option value="software">Software</option>
                    <option value="room">Room</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                  <select value={resourceForm.status} onChange={(e) => setResourceForm((prev) => ({ ...prev, status: e.target.value as ResourceStatus }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Assign To</label>
                  <select value={resourceForm.assignTo} onChange={(e) => setResourceForm((prev) => ({ ...prev, assignTo: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50">
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Location</label>
                <input type="text" value={resourceForm.location} onChange={(e) => setResourceForm((prev) => ({ ...prev, location: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={resourceForm.description} onChange={(e) => setResourceForm((prev) => ({ ...prev, description: e.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50" />
              </div>

              {createResourceError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{createResourceError}</div>}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto rounded-xl border border-border px-4 py-2.5 text-sm text-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isUpdatingResource} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {isUpdatingResource ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Resources Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-5">
          {displayResources.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              {...resource}
              isAdmin={isAdmin}
              onModify={() => openEditResourceModal(resource)}
              onRequest={() => handleRequestResource(resource)}
              onAssign={() => handleAssignResource(resource)}
              onMarkAvailable={() => handleSetResourceAvailable(resource, 'Mark as Available?', `Move ${resource.name} back to available?`)}
              onMaintenance={() => handleSetResourceMaintenance(resource)}
              onApprove={() => handleReviewRequest(resource, 'approve')}
              onReject={() => {
                if (resource.status === 'assigned') {
                  return handleSetResourceAvailable(resource, 'Unassign resource?', `Unassign ${resource.name} and move it to available?`);
                }
                return handleReviewRequest(resource, 'reject');
              }}
              delay={index * 0.05}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayResources.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No resources found
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery
              ? `No resources match "${searchQuery}". Try a different search term.`
              : "There are no resources matching your filters."}
          </p>
        </motion.div>
      )}

    </AppLayout>
  );
}