import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  type: string;
  icon?: string;
  user: string;
  action: string;
  time: string;
  createdAt?: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

const VISIBLE_ACTIVITY_LIMIT = 8;

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
  const [isAllActivityOpen, setIsAllActivityOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hasOverflow = activities.length > VISIBLE_ACTIVITY_LIMIT;
  const visibleActivities = useMemo(
    () => (hasOverflow ? activities.slice(0, VISIBLE_ACTIVITY_LIMIT) : activities),
    [activities, hasOverflow],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const getRelativeTime = (createdAt?: string, fallback?: string) => {
    if (!createdAt) {
      return fallback ?? "Just now";
    }

    const parsedDate = new Date(createdAt);
    const timestamp = parsedDate.getTime();
    if (Number.isNaN(timestamp)) {
      return fallback ?? "Just now";
    }

    const diffMs = Math.max(0, nowMs - timestamp);
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;

    if (diffMs >= yearMs) {
      const years = Math.floor(diffMs / yearMs);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
    if (diffMs >= monthMs) {
      const months = Math.floor(diffMs / monthMs);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }
    if (diffMs >= dayMs) {
      const days = Math.floor(diffMs / dayMs);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
    if (diffMs >= hourMs) {
      const hours = Math.floor(diffMs / hourMs);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
    if (diffMs >= minuteMs) {
      const minutes = Math.floor(diffMs / minuteMs);
      return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    }

    return "Just now";
  };

  if (!activities || activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="card-elevated p-6 h-full"
      >
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card-elevated p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        {hasOverflow && (
          <button
            type="button"
            onClick={() => setIsAllActivityOpen(true)}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View all ({activities.length})
          </button>
        )}
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-button]:hidden">
        {visibleActivities.map((activity, index) => {
          const displayTime = getRelativeTime(activity.createdAt, activity.time);
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              className="relative flex gap-4 py-4 group"
            >
              {/* Timeline line */}
              {index !== visibleActivities.length - 1 && (
                <div className="absolute left-5 top-14 w-px h-[calc(100%-20px)] bg-border" />
              )}

              {/* Icon */}
              <div className="relative z-10 w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                {activity.icon ? (
                  <FontAwesomeIcon
                    icon={activity.icon}
                    size="sm"
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {displayTime}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={isAllActivityOpen} onOpenChange={setIsAllActivityOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle>All Recent Activity</DialogTitle>
            <DialogDescription>
              Full activity timeline across user and admin actions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 overflow-y-auto max-h-[52vh] pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-button]:hidden">
            {activities.map((activity, index) => {
              const displayTime = getRelativeTime(activity.createdAt, activity.time);
              return (
              <div key={`${activity.id}-${index}`} className="relative flex gap-4 py-4 group">
                {index !== activities.length - 1 && (
                  <div className="absolute left-5 top-14 w-px h-[calc(100%-20px)] bg-border" />
                )}

                <div className="relative z-10 w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  {activity.icon ? (
                    <FontAwesomeIcon
                      icon={activity.icon}
                      size="sm"
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {displayTime}
                    </span>
                  </div>
                </div>
              </div>
            );})}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}