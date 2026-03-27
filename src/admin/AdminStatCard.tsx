import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  title: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  delay?: number;
  tone?: "primary" | "accent" | "warning" | "success";
}

const toneStyles: Record<NonNullable<AdminStatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function AdminStatCard({
  title,
  value,
  hint,
  icon: Icon,
  delay = 0,
  tone = "primary",
}: AdminStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="card-elevated p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneStyles[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}
