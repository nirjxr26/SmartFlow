import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListTodo, Package, ClipboardCheck, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { MiniChart } from "@/components/dashboard/MiniChart";

interface KPIData {
  value: number;
  change: number;
  icon?: string;
  color?: string;
}

interface DashboardData {
  kpis: {
    totalTasks: KPIData;
    pendingApprovals: KPIData;
    resourcesInUse: KPIData;
    completedTasks: KPIData;
  };
  charts: {
    tasksThisWeek: Array<{ name: string; value: number }>;
    resourceUtilization: Array<{ name: string; value: number }>;
    monthlyCompletion: Array<{ name: string; value: number }>;
  };
  activities: Array<{
    id: number;
    type: string;
    icon?: string;
    user: string;
    action: string;
    time: string;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    fetchDashboardData();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.name) {
      setUserName(user.name.split(" ")[0]);
    }
  }, []);

  async function fetchDashboardData() {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?.id || 1;
      const response = await fetch(`http://localhost:8000/backend/dashboard/dashboard.php?user_id=${userId}`, {
        headers: {
          Authorization: localStorage.getItem("token") || "",
        },
      });
      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const quickActions = [
    { label: "New Task", icon: ListTodo, onClick: () => navigate("/tasks?create=1") },
    { label: "Book Resource", icon: Package, onClick: () => navigate("/resources") },
    { label: "Submit Request", icon: ClipboardCheck, onClick: () => navigate("/approvals") },
    { label: "View Reports", icon: BarChart3, onClick: () => navigate("/reports") },
  ];

  const kpis = [
    { title: "Total Tasks", data: data?.kpis.totalTasks, changeLabel: "vs last month", delay: 0 },
    { title: "Pending Approvals", data: data?.kpis.pendingApprovals, changeLabel: "vs last week", delay: 0.1 },
    { title: "Resources in Use", data: data?.kpis.resourcesInUse, changeLabel: "currently active", delay: 0.2 },
    { title: "Completed Tasks", data: data?.kpis.completedTasks, changeLabel: "this month", delay: 0.3 },
  ];

  if (isLoading || !data) {
    return (
      <AppLayout title="Dashboard" subtitle={`Welcome back, ${userName}. Loading your dashboard...`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${userName}. Here's what's happening today.`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {kpis.map((item) => {
          if (!item.data) return null;

          return (
            <KPICard
              key={item.title}
              title={item.title}
              value={item.data.value}
              change={item.data.change}
              changeLabel={item.changeLabel}
              icon={item.data.icon}
              color={item.data.color}
              delay={item.delay}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MiniChart
              title="Tasks This Week"
              data={data.charts.tasksThisWeek}
              type="bar"
              color="primary"
              delay={0.4}
            />
            <MiniChart
              title="Resource Utilization"
              data={data.charts.resourceUtilization}
              type="area"
              color="accent"
              delay={0.5}
            />
          </div>

          <div className="card-elevated p-7">
            <h2 className="text-sm font-semibold text-foreground mb-5">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/15 transition-transform">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Chart */}
          <MiniChart
            title="Task Completion Trend"
            data={data.charts.monthlyCompletion}
            type="area"
            color="warning"
            delay={0.6}
          />
        </div>

        <div className="lg:col-span-1 h-full">
          <ActivityFeed activities={data.activities} />
        </div>
      </div>
    </AppLayout>
  );
}