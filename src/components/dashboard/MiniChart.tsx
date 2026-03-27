import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  secondary?: number;
}

interface MiniChartProps {
  title: string;
  data: ChartData[];
  type?: "area" | "bar";
  color?: "primary" | "accent" | "success";
  delay?: number;
}

const colorMap = {
  primary: {
    stroke: "hsl(230, 45%, 28%)",
    fill: "hsl(230, 45%, 28%)",
    gradient: ["hsl(230, 45%, 28%)", "hsl(230, 45%, 28%, 0.1)"],
  },
  accent: {
    stroke: "hsl(174, 42%, 42%)",
    fill: "hsl(174, 42%, 42%)",
    gradient: ["hsl(174, 42%, 42%)", "hsl(174, 42%, 42%, 0.1)"],
  },
  success: {
    stroke: "hsl(158, 50%, 42%)",
    fill: "hsl(158, 50%, 42%)",
    gradient: ["hsl(158, 50%, 42%)", "hsl(158, 50%, 42%, 0.1)"],
  },
};

export function MiniChart({
  title,
  data,
  type = "area",
  color = "primary",
  delay = 0,
}: MiniChartProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-elevated p-6"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.gradient[0]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.gradient[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.stroke}
                strokeWidth={2}
                fill={`url(#gradient-${color})`}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} barSize={24}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "var(--shadow-lg)",
                }}
                cursor={{ fill: "hsl(var(--muted))", radius: 8 }}
              />
              <Bar dataKey="value" fill={colors.fill} radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}