import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminPanel } from "@/admin/AdminPanel";

interface ProfileResponse {
  success: boolean;
  user?: {
    role?: string;
  };
}

const canManageUsersRole = (role?: string) => {
  const normalized = (role || "").toLowerCase();
  return normalized.includes("admin") || normalized.includes("hr") || normalized.includes("executive");
};

export default function Admin() {
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const localRole = (storedUser?.role || "").toLowerCase();

        if (canManageUsersRole(localRole)) {
          setIsAllowed(true);
          return;
        }

        if (!storedUser?.id) {
          setIsAllowed(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/backend/users/profile.php?id=${storedUser.id}`, {
          headers: {
            Authorization: localStorage.getItem("token") || "",
          },
        });

        const data: ProfileResponse = await response.json();
        const role = (data.user?.role || "").toLowerCase();
        setIsAllowed(data.success && canManageUsersRole(role));
      } catch (error) {
        console.error("Failed to validate privileged access:", error);
        setIsAllowed(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, []);

  if (isCheckingAccess) {
    return (
      <AppLayout title="Admin Panel" subtitle="Verifying privileged access...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAllowed) {
    return (
      <AppLayout title="Admin Panel" subtitle="Access is restricted to Admin, HR, or Executive accounts.">
        <div className="card-elevated p-8 max-w-2xl mx-auto mt-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            This view is available only for users with Admin, HR, or Executive roles.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Panel" subtitle="Operational visibility across users, tasks, approvals, and resources.">
      <AdminPanel />
    </AppLayout>
  );
}
