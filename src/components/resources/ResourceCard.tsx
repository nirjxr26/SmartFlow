import { motion } from "framer-motion";
import { Monitor, Cpu, DoorOpen, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResourceType = "device" | "software" | "room" | "equipment";
export type ResourceStatus = "available" | "assigned" | "maintenance";

interface ResourceCardProps {
  id: number;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  assignedTo?: {
    name: string;
  };
  location?: string;
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
  location,
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
      className="card-interactive p-5 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <TypeIcon className="w-6 h-6 text-primary" />
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
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-sm text-muted-foreground">{typeStyle.label}</p>
        {location && (
          <p className="text-xs text-muted-foreground">{location}</p>
        )}
      </div>

      {/* Assigned To */}
      {assignedTo && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/80 to-accent flex items-center justify-center">
              <span className="text-accent-foreground text-[10px] font-semibold">
                {assignedTo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assigned to</p>
              <p className="text-sm font-medium text-foreground">
                {assignedTo.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}