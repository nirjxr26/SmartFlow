import { motion } from "framer-motion";
import { Calendar, MessageSquare, Paperclip, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TaskStatus = "pending" | "in-progress" | "review" | "completed";
export type TaskPriority = "high" | "medium" | "low";

interface TaskCardProps {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: {
    name: string;
    avatar?: string;
  };
  deadline: string;
  comments?: number;
  attachments?: number;
  delay?: number;
  canManage?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  pending: { label: "Pending", class: "badge-pending", borderClass: "border-l-warning/40" },
  "in-progress": { label: "In Progress", class: "badge-progress", borderClass: "border-l-info/40" },
  review: { label: "Review", class: "badge-review", borderClass: "border-l-accent/40" },
  completed: { label: "Completed", class: "badge-completed", borderClass: "border-l-success/40" },
};

const priorityConfig = {
  high: { label: "High", class: "priority-high" },
  medium: { label: "Medium", class: "priority-medium" },
  low: { label: "Low", class: "priority-low" },
};

export function TaskCard({
  title,
  description,
  status,
  priority,
  assignee,
  deadline,
  comments = 0,
  attachments = 0,
  delay = 0,
  canManage = false,
  onClick,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const statusStyle = statusConfig[status];
  const priorityStyle = priorityConfig[priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={cn(
        "card-interactive p-5 cursor-pointer group relative border-l-[3px]",
        statusStyle.borderClass
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and Priority */}
          <div className="flex items-start gap-3 mb-2">
            <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            <span
              className={cn(
                "flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                priorityStyle.class
              )}
            >
              {priorityStyle.label}
            </span>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Status Badge */}
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-lg",
                statusStyle.class
              )}
            >
              {statusStyle.label}
            </span>

            {/* Deadline */}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {deadline}
            </span>

            {/* Comments */}
            {comments > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                {comments}
              </span>
            )}

            {/* Attachments */}
            {attachments > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="w-3.5 h-3.5" />
                {attachments}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start">
          {/* Assignee */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-semibold">
              {assignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
        </div>
      </div>

      {canManage && (onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit task"
              aria-label="Edit task"
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete task"
              aria-label="Delete task"
              className="h-8 w-8 rounded-lg border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}