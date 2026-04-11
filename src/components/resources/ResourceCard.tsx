import { motion } from "framer-motion";
import { Monitor, Cpu, DoorOpen, Package, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResourceType = "device" | "software" | "room" | "equipment";
export type ResourceStatus = "available" | "assigned" | "maintenance";

interface ResourceCardProps {
  id: number;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  assignedTo?: {
    id?: number;
    name: string;
  };
  description?: string;
  location?: string;
  isAdmin?: boolean;
  onModify?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  delay?: number;
}

const typeConfig = {
  device: { icon: Monitor, label: "Device" },
  software: { icon: Cpu, label: "Software" },
  room: { icon: DoorOpen, label: "Room" },
  equipment: { icon: Package, label: "Equipment" },
};

const statusConfig = {
  available: { label: "Available", class: "badge-completed" },
  assigned: { label: "Assigned", class: "badge-progress" },
  maintenance: { label: "Maintenance", class: "badge-pending" },
};

export function ResourceCard({
  name,
  type,
  status,
  assignedTo,
  description,
  location,
  isAdmin = false,
  onModify,
  onApprove,
  onReject,
  delay = 0,
}: ResourceCardProps) {
  const typeStyle = typeConfig[type];
  const statusStyle = statusConfig[status];
  const TypeIcon = typeStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="card-interactive p-5 group h-full min-h-[220px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
            <TypeIcon className="w-6 h-6 text-primary" />
          </div>
          {assignedTo && (
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none mb-1">Assigned to</p>
              <p className="text-xs font-medium text-foreground truncate">{assignedTo.name}</p>
            </div>
          )}
        </div>
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-lg",
            statusStyle.class
          )}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors truncate">
            {name}
          </h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground flex-shrink-0">
            {typeStyle.label}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        {location && (
          <p className="text-xs text-muted-foreground">{location}</p>
        )}
      </div>

      {isAdmin && (
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <button
            type="button"
            onClick={onModify}
            title="Modify"
            aria-label="Modify"
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onApprove}
            title="Approve"
            aria-label="Approve"
            className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReject}
            title="Reject"
            aria-label="Reject"
            className="h-8 w-8 rounded-lg border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}