import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Monitor, Cpu, DoorOpen, Package, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ResourceCard, ResourceType, ResourceStatus } from "@/components/resources/ResourceCard";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

interface Resource {
  id: number;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  assignedTo?: { name: string };
  location?: string;
  description?: string;
}

const typeFilters = [
  { key: "all", label: "All", icon: null },
  { key: "device", label: "Devices", icon: Monitor },
  { key: "software", label: "Software", icon: Cpu },
  { key: "room", label: "Rooms", icon: DoorOpen },
  { key: "equipment", label: "Equipment", icon: Package },
];

const statusFilters = [
  { key: "all", label: "All Status" },
  { key: "available", label: "Available" },
  { key: "assigned", label: "Assigned" },
  { key: "maintenance", label: "Maintenance" },
];

export default function Resources() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [createResourceError, setCreateResourceError] = useState("");
  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "device" as ResourceType,
    location: "",
    description: "",
  });

  useEffect(() => {
    fetchResources();
  }, [typeFilter, statusFilter]);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`http://localhost:8000/backend/resources.php?${params.toString()}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();

      if (data.success) {
        setResources(data.resources);
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

    if (!resourceForm.name.trim()) {
      setCreateResourceError("Please enter a resource name");
      return;
    }

    setCreateResourceError("");
    setIsCreatingResource(true);

    try {
      const response = await fetch('http://localhost:8000/backend/resources.php', {
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

  return (
    <AppLayout title="Resources" subtitle="Manage and allocate resources across your organization.">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
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

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all cursor-pointer"
          >
            {statusFilters.map((filter) => (
              <option key={filter.key} value={filter.key}>
                {filter.label}
              </option>
            ))}
          </select>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary-gradient flex items-center gap-2"
            onClick={() => {
              setCreateResourceError("");
              setIsCreateModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </motion.button>
        </div>
      </div>

      {/* Create Resource Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">Add New Resource</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 px-6 py-5">
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

      {/* Type Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {typeFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.key}
              onClick={() => setTypeFilter(filter.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                typeFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Resources Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredResources.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              {...resource}
              delay={index * 0.05}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredResources.length === 0 && (
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