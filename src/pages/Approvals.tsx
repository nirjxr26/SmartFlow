import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ApprovalCard, ApprovalStatus } from "@/components/approvals/ApprovalCard";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

interface Approval {
  id: number;
  type: string;
  requestedBy: {
    name: string;
    department: string;
  };
  date: string;
  description: string;
  status: ApprovalStatus;
}

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/backend/approvals.php?status=${activeTab}`, {
        headers: {
          'Authorization': localStorage.getItem('token') || '',
        },
      });
      const data = await response.json();

      if (data.success) {
        setApprovals(data.approvals);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const result = await Swal.fire({
      title: 'Approve Request?',
      text: 'Are you sure you want to approve this request?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, approve it!',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('http://localhost:8000/backend/approvals.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || '',
          },
          body: JSON.stringify({ id, action: 'approve' }),
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            title: 'Approved!',
            text: 'The request has been approved.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            timer: 1500,
          });
          fetchApprovals();
        } else {
          Swal.fire({
            title: 'Error',
            text: data.message || 'Failed to approve request',
            icon: 'error',
            confirmButtonColor: '#3b82f6',
          });
        }
      } catch (error) {
        console.error('Failed to approve:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to approve request',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const handleReject = async (id: number) => {
    const result = await Swal.fire({
      title: 'Reject Request?',
      text: 'Are you sure you want to reject this request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, reject it',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('http://localhost:8000/backend/approvals.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || '',
          },
          body: JSON.stringify({ id, action: 'reject' }),
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            title: 'Rejected',
            text: 'The request has been rejected.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
            timer: 1500,
          });
          fetchApprovals();
        } else {
          Swal.fire({
            title: 'Error',
            text: data.message || 'Failed to reject request',
            icon: 'error',
            confirmButtonColor: '#3b82f6',
          });
        }
      } catch (error) {
        console.error('Failed to reject:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to reject request',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const tabs = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <AppLayout title="Approvals" subtitle="Review and manage pending approval requests.">
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ApprovalStatus)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Approvals Grid */}
      {!isLoading && approvals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {approvals.map((approval, index) => (
            <ApprovalCard
              key={approval.id}
              {...approval}
              delay={index * 0.1}
              onApprove={() => handleApprove(approval.id)}
              onReject={() => handleReject(approval.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && approvals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No {activeTab} requests
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {activeTab === "pending"
              ? "All caught up! There are no pending approval requests."
              : `There are no ${activeTab} requests to display.`}
          </p>
        </motion.div>
      )}
    </AppLayout>
  );
}