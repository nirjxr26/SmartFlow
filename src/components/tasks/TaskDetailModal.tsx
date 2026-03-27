import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  User,
  Clock,
  Paperclip,
  Send,
  FileText,
  Image,
  Download,
  MoreVertical,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "./TaskCard";

interface Comment {
  id: number;
  user: string;
  content: string;
  time: string;
}

interface Attachment {
  id: number;
  name: string;
  type: "pdf" | "image" | "doc";
  size: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (taskId: number, updates: any) => void;
  onDelete?: (taskId: number) => void;
  task: {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee: { name: string };
    deadline: string;
    createdAt: string;
    comments?: Comment[];
    attachments?: Attachment[];
  } | null;
}

const statusSteps = [
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

const fileIcons = {
  pdf: FileText,
  image: Image,
  doc: FileText,
};

export function TaskDetailModal({ isOpen, onClose, task, onUpdate, onDelete }: TaskDetailModalProps) {
  const [newComment, setNewComment] = useState("");

  if (!task) return null;

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === task.status);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onUpdate && task.id) {
      onUpdate(task.id, { status: newStatus });
    }
  };

  const handleDelete = () => {
    if (onDelete && task.id) {
      onDelete(task.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-card border-l border-border z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  TASK-{task.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Title and Description */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  {task.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Progress</h3>
                <div className="flex items-center gap-2">
                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <button
                          onClick={() => onUpdate && handleStatusChange(step.key as TaskStatus)}
                          disabled={!onUpdate}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            index <= currentStatusIndex
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                            onUpdate && "cursor-pointer"
                          )}
                        >
                          {index < currentStatusIndex ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-semibold">{index + 1}</span>
                          )}
                        </button>
                        <span
                          className={cn(
                            "text-[10px] font-medium mt-1.5 text-center",
                            index <= currentStatusIndex
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            "h-0.5 flex-1 -mt-4 mx-1",
                            index < currentStatusIndex ? "bg-primary" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-subtle p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Assigned to
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-[10px] font-semibold">
                        {task.assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {task.assignee.name}
                    </span>
                  </div>
                </div>

                <div className="card-subtle p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Due Date
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {task.deadline}
                  </span>
                </div>

                <div className="card-subtle p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Created
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {task.createdAt}
                  </span>
                </div>

                <div className="card-subtle p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Attachments
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {task.attachments?.length || 0} files
                  </span>
                </div>
              </div>

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Attachments
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {task.attachments.map((file) => {
                      const FileIcon = fileIcons[file.type];
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {file.size}
                            </p>
                          </div>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-background hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Comments ({task.comments?.length || 0})
                </h3>
                
                <div className="space-y-4">
                  {task.comments && task.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/80 to-accent flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-foreground text-[10px] font-semibold">
                          {comment.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {comment.user}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex gap-3 pt-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-[10px] font-semibold">
                      AJ
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-4 py-2.5 pr-12 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}