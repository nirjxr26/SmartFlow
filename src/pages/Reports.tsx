import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Calendar, TrendingUp, Users, CheckCircle2, Box } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ReportData {
  kpis: {
    totalCompleted: { value: string; change: string };
    activeUsers: { value: string; change: string };
    resourceUtilization: { value: string; change: string };
    avgCompletionTime: { value: string; change: string };
  };
  monthlyTasks: Array<{ name: string; completed: number; created: number }>;
  userPerformance: Array<{ name: string; tasks: number }>;
  resourceUtilization: Array<{ name: string; value: number; color: string }>;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/reports.php', {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch reports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const csvEscape = (value: string | number) => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleExportReport = () => {
    if (!data || isExporting) return;

    setIsExporting(true);

    try {
      const lines: string[] = [];
      const now = new Date();
      const timestamp = now.toISOString();

      lines.push("FlowStone Reports Export");
      lines.push(`Generated At,${csvEscape(timestamp)}`);
      lines.push("");

      lines.push("KPI Summary");
      lines.push("Metric,Value,Change");
      lines.push(`Total Tasks Completed,${csvEscape(data.kpis.totalCompleted.value)},${csvEscape(data.kpis.totalCompleted.change)}`);
      lines.push(`Active Users,${csvEscape(data.kpis.activeUsers.value)},${csvEscape(data.kpis.activeUsers.change)}`);
      lines.push(`Resources Utilized,${csvEscape(data.kpis.resourceUtilization.value)},${csvEscape(data.kpis.resourceUtilization.change)}`);
      lines.push(`Avg Completion Time,${csvEscape(data.kpis.avgCompletionTime.value)},${csvEscape(data.kpis.avgCompletionTime.change)}`);
      lines.push("");

      lines.push("Monthly Tasks");
      lines.push("Month,Completed,Created");
      data.monthlyTasks.forEach((item) => {
        lines.push(`${csvEscape(item.name)},${item.completed},${item.created}`);
      });
      lines.push("");

      lines.push("User Performance");
      lines.push("User,Tasks");
      data.userPerformance.forEach((item) => {
        lines.push(`${csvEscape(item.name)},${item.tasks}`);
      });
      lines.push("");

      lines.push("Resource Utilization");
      lines.push("Category,UtilizationPercent,Color");
      data.resourceUtilization.forEach((item) => {
        lines.push(`${csvEscape(item.name)},${item.value},${csvEscape(item.color)}`);
      });

      const csvContent = lines.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const fileName = `flowstone-report-${yyyy}${mm}${dd}-${hh}${min}.csv`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <AppLayout title="Reports & Analytics" subtitle="Comprehensive insights into your workflow and resources.">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const kpiData = [
    { title: "Total Tasks Completed", value: data.kpis.totalCompleted.value, change: data.kpis.totalCompleted.change, icon: CheckCircle2 },
    { title: "Active Users", value: data.kpis.activeUsers.value, change: data.kpis.activeUsers.change, icon: Users },
    { title: "Resources Utilized", value: data.kpis.resourceUtilization.value, change: data.kpis.resourceUtilization.change, icon: Box },
    { title: "Avg. Completion Time", value: data.kpis.avgCompletionTime.value, change: data.kpis.avgCompletionTime.change, icon: TrendingUp },
  ];

  return (
    <AppLayout title="Reports & Analytics" subtitle="Comprehensive insights into your workflow and resources.">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Jan 1 - Dec 18, 2024</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportReport}
          disabled={isExporting || !data}
          className="btn-accent-gradient flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? "Exporting..." : "Export Report"}</span>
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-elevated p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <kpi.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-success">{kpi.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{kpi.value}</h3>
            <p className="text-sm text-muted-foreground">{kpi.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tasks Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Tasks Completed per Month</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTasks}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(230, 45%, 28%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(230, 45%, 28%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174, 42%, 42%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(174, 42%, 42%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-lg)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(230, 45%, 28%)"
                  strokeWidth={2}
                  fill="url(#completedGradient)"
                  name="Completed"
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="hsl(174, 42%, 42%)"
                  strokeWidth={2}
                  fill="url(#createdGradient)"
                  name="Created"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Top Performers</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.userPerformance} layout="vertical" barSize={20}>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-lg)",
                  }}
                  cursor={{ fill: "hsl(var(--muted))", radius: 8 }}
                />
                <Bar dataKey="tasks" fill="hsl(174, 42%, 42%)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Resource Utilization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-elevated p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-6">Resource Utilization by Category</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.resourceUtilization}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.resourceUtilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-lg)",
                  }}
                  formatter={(value: number) => [`${value}%`, "Utilization"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {data.resourceUtilization.map((resource) => (
              <div key={resource.name} className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: resource.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{resource.name}</span>
                    <span className="text-sm font-semibold text-foreground">{resource.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resource.value}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: resource.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}