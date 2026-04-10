import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Monitor, Cpu, DoorOpen, Package, X } from "lucide-react";
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
            onClick={async () => {
              const result = await Swal.fire({
                title: 'Add New Resource',
                html: `
                  <input id="name" class="swal2-input" placeholder="Resource Name">
                  <select id="type" class="swal2-input">
                    <option value="device">Device</option>
                    <option value="software">Software</option>
                    <option value="room">Room</option>
                    <option value="equipment">Equipment</option>
                  </select>
                  <input id="location" class="swal2-input" placeholder="Location (optional)">
                  <textarea id="description" class="swal2-textarea" placeholder="Description (optional)"></textarea>
                `,
                confirmButtonText: 'Add Resource',
                confirmButtonColor: '#3b82f6',
                showCancelButton: true,
                preConfirm: () => {
                  const name = (document.getElementById('name') as HTMLInputElement).value;
                  const type = (document.getElementById('type') as HTMLSelectElement).value;
                  const location = (document.getElementById('location') as HTMLInputElement).value;
                  const description = (document.getElementById('description') as HTMLTextAreaElement).value;
                  
                  if (!name) {
                    Swal.showValidationMessage('Please enter a resource name');
                  }
                  
                  return { name, type, location, description };
                }
              });
              
              if (result.isConfirmed && result.value) {
                try {
                  const response = await fetch('http://localhost:8000/backend/resources.php', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': localStorage.getItem('token') || '',
                    },
                    body: JSON.stringify(result.value),
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    Swal.fire({
                      title: 'Success!',
                      text: 'Resource added successfully',
                      icon: 'success',
                      confirmButtonColor: '#3b82f6',
                      timer: 1500,
                    });
                    fetchResources();
                  }
                } catch (error) {
                  console.error('Failed to add resource:', error);
                }
              }
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </motion.button>
        </div>
      </div>

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