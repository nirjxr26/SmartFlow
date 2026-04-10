import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: number;
  type: string;
  icon?: string;
  user: string;
  action: string;
  time: string;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
}

export function ActivityFeed({ activities = [] }: ActivityFeedProps) {
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
      </div>

      <div className="space-y-1 flex-1 overflow-y-auto">
        {activities.map((activity, index) => {
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
              className="relative flex gap-4 py-4 group"
            >
              {/* Timeline line */}
              {index !== activities.length - 1 && (
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
                    {activity.time}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}