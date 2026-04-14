import { useState, useRef, useEffect } from "react";
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
  Trash2,
  Check,
  AlertCircle,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "./TaskCard";

interface Comment {
  id: number;
  userId: number;
  user: string;
  content: string;
  time: string;
}

interface Attachment {
  id: number;
  name: string;
  type: "pdf" | "image" | "doc" | "other";
  size: string;
  uploadedBy?: string;
  uploadedById?: number;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (taskId: number, updates: any) => void;
  onDelete?: (taskId: number) => void;
  onDataUpdate?: (taskId: number, comments: number, attachments: number) => void;
  task: {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee: { name: string };
    createdBy: { id: number; name: string };
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
  other: FileText,
};

export function TaskDetailModal({ isOpen, onClose, task, onUpdate, onDelete, onDataUpdate }: TaskDetailModalProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>(task?.comments || []);
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<number | null>(null);
  const [renamingAttachmentName, setRenamingAttachmentName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUserId, setCurrentUserId] = useState(1);
  const [currentUserRole, setCurrentUserRole] = useState("");

  // Get current user ID
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{"id": 1}');
    setCurrentUserId(user.id || 1);
    setCurrentUserRole((user.role || '').toLowerCase());
  }, []);

  // Sync state with prop changes
  useEffect(() => {
    if (task && isOpen) {
      setComments(task.comments || []);
      setAttachments(task.attachments || []);
      setNewComment("");
      setUploadError("");
      setUploadSuccess("");
      setEditingCommentId(null);
      setRenamingAttachmentId(null);
    }
  }, [task?.id, isOpen]);

  if (!task) return null;

  const isAdmin = currentUserRole.includes('admin');
  const isTaskCreator = task.createdBy?.id === currentUserId;
  const canManageTask = isAdmin || isTaskCreator;

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === task.status);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onUpdate && task.id && canManageTask) {
      onUpdate(task.id, { status: newStatus });
    }
  };

  const handleDelete = () => {
    if (onDelete && task.id) {
      onDelete(task.id);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/backend/tasks/comments/add_comment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: task.id,
          content: newComment,
          user_id: currentUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setComments([result.comment, ...comments]);
        setNewComment("");
        // Notify parent
        if (onDataUpdate) {
          onDataUpdate(task.id, comments.length + 1, attachments.length);
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch('http://localhost:8000/backend/tasks/comments/delete_comment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          user_id: currentUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const updatedComments = comments.filter((c) => c.id !== commentId);
        setComments(updatedComments);
        // Notify parent
        if (onDataUpdate) {
          onDataUpdate(task.id, updatedComments.length, attachments.length);
        }
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEditComment = (comment: Comment) => {
    // Only allow editing your own comments unless admin
    if (!isAdmin && comment.userId !== currentUserId) {
      alert('You can only edit your own comments');
      return;
    }
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleSaveComment = async (commentId: number) => {
    if (!editingCommentContent.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/tasks/comments/edit_comment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          content: editingCommentContent,
          user_id: currentUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setComments(comments.map((c) => 
          c.id === commentId ? { ...c, content: editingCommentContent } : c
        ));
        setEditingCommentId(null);
        setEditingCommentContent("");
      } else {
        alert(result.message || 'Failed to edit comment');
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
      alert('Failed to edit comment');
    }
  };

  const handleRenameAttachment = (attachment: Attachment) => {
    // Only allow renaming your own attachments unless admin
    if (!isAdmin && attachment.uploadedById !== currentUserId) {
      alert('You can only rename your own attachments');
      return;
    }
    setRenamingAttachmentId(attachment.id);
    setRenamingAttachmentName(attachment.name);
  };

  const handleSaveRename = async (attachmentId: number) => {
    if (!renamingAttachmentName.trim()) {
      alert('Filename cannot be empty');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/backend/tasks/attachments/rename_attachment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attachment_id: attachmentId,
          filename: renamingAttachmentName,
          user_id: currentUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAttachments(attachments.map((a) => 
          a.id === attachmentId ? { ...a, name: renamingAttachmentName } : a
        ));
        setRenamingAttachmentId(null);
        setRenamingAttachmentName("");
      } else {
        alert(result.message || 'Failed to rename attachment');
      }
    } catch (error) {
      console.error('Failed to rename attachment:', error);
      alert('Failed to rename attachment');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['txt', 'pdf', 'jpg', 'jpeg', 'png'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      setUploadError('File type not allowed. Allowed: txt, pdf, jpg, png');
      return;
    }

    // Upload file
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('task_id', String(task.id));
    formData.append('user_id', String(currentUserId));

    try {
      const response = await fetch('http://localhost:8000/backend/tasks/attachments/upload_attachment.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setAttachments([...attachments, result.attachment]);
        setUploadSuccess(`${file.name} uploaded successfully`);
        setTimeout(() => setUploadSuccess(""), 3000);
        // Notify parent
        if (onDataUpdate) {
          onDataUpdate(task.id, comments.length, attachments.length + 1);
        }
      } else {
        setUploadError(result.message);
      }
    } catch (error) {
      setUploadError('Failed to upload file');
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      const response = await fetch('http://localhost:8000/backend/tasks/attachments/delete_attachment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attachment_id: attachmentId,
          user_id: currentUserId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const updatedAttachments = attachments.filter((a) => a.id !== attachmentId);
        setAttachments(updatedAttachments);
        // Notify parent
        if (onDataUpdate) {
          onDataUpdate(task.id, comments.length, updatedAttachments.length);
        }
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const handleDownloadAttachment = (attachmentId: number) => {
    window.location.href = `http://localhost:8000/backend/tasks/attachments/download_attachment.php?id=${attachmentId}`;
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
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  TASK-{task.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && canManageTask && (
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

            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              {/* Title and Description */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                  {task.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Progress</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {statusSteps.map((step, index) => (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <button
                          onClick={() => onUpdate && handleStatusChange(step.key as TaskStatus)}
                          disabled={!onUpdate || !canManageTask}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            index <= currentStatusIndex
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                            onUpdate && canManageTask && "cursor-pointer"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {attachments.length} files
                  </span>
                </div>
              </div>

              {/* Attachments Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Attachments
                  </h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Add File'}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {uploadError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
                    <Check className="w-4 h-4" />
                    {uploadSuccess}
                  </div>
                )}

                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((file) => {
                      const FileIcon = fileIcons[file.type];
                      const isRenaming = renamingAttachmentId === file.id;
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isRenaming ? (
                              <input
                                type="text"
                                autoFocus
                                value={renamingAttachmentName}
                                onChange={(e) => setRenamingAttachmentName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveRename(file.id);
                                  } else if (e.key === 'Escape') {
                                    setRenamingAttachmentId(null);
                                    setRenamingAttachmentName("");
                                  }
                                }}
                                className="w-full px-2 py-1 text-sm font-medium bg-primary/10 border border-primary/30 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            ) : (
                              <>
                                <p className="text-sm font-medium text-foreground truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {file.size}
                                </p>
                              </>
                            )}
                          </div>
                          {isRenaming ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveRename(file.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setRenamingAttachmentId(null);
                                  setRenamingAttachmentName("");
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownloadAttachment(file.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-background hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {(isAdmin || file.uploadedById === currentUserId) && (
                                <>
                                  <button
                                    onClick={() => handleRenameAttachment(file)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                    title="Rename"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAttachment(file.id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-xl">
                    <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attachments yet</p>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Comments ({comments.length})
                </h3>
                
                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/80 to-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-accent-foreground text-[10px] font-semibold">
                            {comment.user
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 justify-between">
                            <div>
                              <span className="text-sm font-semibold text-foreground">
                                {comment.user}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {comment.time}
                              </span>
                            </div>
                            {editingCommentId !== comment.id && (isAdmin || comment.userId === currentUserId) && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                  title="Edit comment"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                autoFocus
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveComment(comment.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingCommentId(null);
                                    setEditingCommentContent("");
                                  }
                                }}
                                className="flex-1 px-3 py-2 text-sm bg-primary/10 border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                              <button
                                onClick={() => handleSaveComment(comment.id)}
                                className="px-3 py-2 text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }}
                                className="px-3 py-2 text-xs font-medium bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">No comments yet</p>
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex gap-3 pt-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-[10px] font-semibold">
                      ME
                    </span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newComment.trim()) {
                          handleAddComment();
                        }
                      }}
                      className="w-full px-4 py-2.5 pr-12 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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