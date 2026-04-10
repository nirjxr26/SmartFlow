import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, MoreVertical, MessageSquare, Paperclip, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  pending: { label: "Pending", class: "badge-pending" },
  "in-progress": { label: "In Progress", class: "badge-progress" },
  review: { label: "Review", class: "badge-review" },
  completed: { label: "Completed", class: "badge-completed" },
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
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className="card-interactive p-5 cursor-pointer group relative"
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

        {/* Assignee and Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-semibold">
                {assignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          </div>
          <div className="relative">
            {canManage && (onEdit || onDelete) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            )}

            <AnimatePresence>
              {showMenu && canManage && (onEdit || onDelete) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit?.();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Task
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete?.();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Task
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}