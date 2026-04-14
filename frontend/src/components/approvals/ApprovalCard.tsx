import { motion } from "framer-motion";
import { Calendar, FileText, Check, X, Pencil, Clock3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ApprovalStatus = "pending" | "approved" | "rejected";

interface ApprovalCardProps {
  id: number;
  type: string;
  requestedBy: {
    name: string;
    avatar?: string;
    department?: string;
  };
  date: string;
  description?: string;
  status: ApprovalStatus;
  canModify?: boolean;
  delay?: number;
  onEdit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onPending?: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  pending: { label: "Pending Review", class: "badge-pending", borderClass: "border-l-warning/40" },
  approved: { label: "Approved", class: "badge-completed", borderClass: "border-l-success/40" },
  rejected: { label: "Rejected", class: "badge-error", borderClass: "border-l-destructive/40" },
};

export function ApprovalCard({
  type,
  requestedBy,
  date,
  description,
  status,
  canModify = false,
  delay = 0,
  onEdit,
  onApprove,
  onReject,
  onPending,
  onDelete,
}: ApprovalCardProps) {
  const statusStyle = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "card-elevated p-5 relative overflow-hidden border-l-[3px]",
        statusStyle.borderClass
      )}
    >
      {/* Type Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{type}</h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
          </div>
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

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>
      )}

      {/* Requester */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/80 to-accent flex items-center justify-center">
            <span className="text-accent-foreground text-xs font-semibold">
              {requestedBy.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {requestedBy.name}
            </p>
            {requestedBy.department && (
              <p className="text-xs text-muted-foreground">
                {requestedBy.department}
              </p>
            )}
          </div>
        </div>
      </div>

      {(onApprove || onReject || onPending || onDelete || (status === "pending" && canModify && onEdit)) && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
          {status === "pending" && canModify && onEdit && (
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="w-8 h-8 rounded-lg bg-success flex items-center justify-center text-success-foreground hover:bg-success/90 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {onPending && (
            <button
              onClick={onPending}
              className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-warning hover:border-warning/40 hover:bg-warning/5 transition-all"
            >
              <Clock3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}