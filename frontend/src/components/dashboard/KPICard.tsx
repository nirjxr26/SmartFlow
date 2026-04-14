import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string; // Font Awesome icon class
  color?: string; // Hex color code
  delay?: number;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
  delay = 0,
}: KPICardProps) {
  const isPositive = change && change > 0;

  // Determine background color based on provided color or default
  const getBackgroundColor = (hexColor?: string) => {
    if (!hexColor) return "bg-primary/10";
    // Convert hex to rgba with 0.1 opacity for background
    const rgb = hexColor.replace(/^#/, '').match(/.{1,2}/g)?.map(x => parseInt(x, 16)).join(',');
    return `rgba(${rgb}, 0.1)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className="card-interactive p-6"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-foreground tracking-tight">
              {value}
            </h3>
            {change !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          {changeLabel && (
            <p className="text-xs text-muted-foreground">{changeLabel}</p>
          )}
        </div>
        {icon && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: getBackgroundColor(color),
            }}
          >
            <FontAwesomeIcon
              icon={icon}
              size="lg"
              color={color}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}