"use client";

import { useState, useEffect } from "react";

interface ApprovalStep {
  stepNumber: number;
  name: string;
  description?: string;
  approverIds: string[];
  requireAll: boolean;
}

interface ApprovalRecord {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  stepNumber: number;
  approver: {
    id: string;
    name: string;
  };
  decidedAt?: string;
}

interface ApprovalProgressProps {
  documentId: string;
  currentStepNumber: number | null;
  documentStatus: "DRAFT" | "IN_APPROVAL" | "APPROVED" | "REJECTED";
}

export function ApprovalProgress({
  documentId,
  currentStepNumber,
  documentStatus,
}: ApprovalProgressProps) {
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApprovalData() {
      try {
        const token = localStorage.getItem("token");

        // Fetch document with template route and approvals
        const res = await fetch(`/api/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const document = await res.json();

          // Get approval route steps from template
          if (document.template?.approvalRoute?.steps) {
            setSteps(document.template.approvalRoute.steps);
          }

          // Fetch all approvals for this document
          const approvalsRes = await fetch(`/api/documents/${documentId}/approvals`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (approvalsRes.ok) {
            const approvalsData = await approvalsRes.json();
            setApprovals(approvalsData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch approval data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchApprovalData();
  }, [documentId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Approval Progress</h3>
        <p className="text-[13px] text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-zinc-900 mb-4">Approval Progress</h3>
        <p className="text-[13px] text-zinc-500">No approval route configured for this template.</p>
      </div>
    );
  }

  function getStepStatus(step: ApprovalStep): "completed" | "current" | "pending" | "rejected" {
    if (documentStatus === "REJECTED") {
      // Check if this step was rejected
      const stepApprovals = approvals.filter((a) => a.stepNumber === step.stepNumber);
      if (stepApprovals.some((a) => a.status === "REJECTED")) {
        return "rejected";
      }
      // If step number is less than current, it was completed before rejection
      if (currentStepNumber && step.stepNumber < currentStepNumber) {
        return "completed";
      }
      return "pending";
    }

    if (documentStatus === "APPROVED") {
      return "completed";
    }

    if (!currentStepNumber) {
      return "pending";
    }

    if (step.stepNumber < currentStepNumber) {
      return "completed";
    }

    if (step.stepNumber === currentStepNumber) {
      return "current";
    }

    return "pending";
  }

  function getStepApprovals(stepNumber: number) {
    return approvals.filter((a) => a.stepNumber === stepNumber);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-[15px] font-semibold text-zinc-900 mb-6">Approval Progress</h3>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const stepApprovals = getStepApprovals(step.stepNumber);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.stepNumber} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-10 bottom-0 w-0.5 -mb-6 ${
                    status === "completed" ? "bg-emerald-400" : "bg-zinc-200"
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                {/* Step indicator */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    status === "completed"
                      ? "bg-emerald-500"
                      : status === "current"
                      ? "bg-amber-500"
                      : status === "rejected"
                      ? "bg-rose-500"
                      : "bg-zinc-200"
                  }`}
                >
                  {status === "completed" ? (
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : status === "rejected" ? (
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span
                      className={`text-[13px] font-semibold ${
                        status === "current" ? "text-white" : "text-zinc-500"
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-[14px] font-semibold text-zinc-900">
                        {step.name}
                      </h4>
                      {step.description && (
                        <p className="mt-0.5 text-[12.5px] text-zinc-500">
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        status === "completed"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : status === "current"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : status === "rejected"
                          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                          : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200"
                      }`}
                    >
                      {status === "completed"
                        ? "Completed"
                        : status === "current"
                        ? "In Progress"
                        : status === "rejected"
                        ? "Rejected"
                        : "Pending"}
                    </span>
                  </div>

                  {/* Approvers info */}
                  {stepApprovals.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {stepApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-center gap-2 text-[12.5px]"
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              approval.status === "APPROVED"
                                ? "bg-emerald-500"
                                : approval.status === "REJECTED"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="font-medium text-zinc-700">
                            {approval.approver.name}
                          </span>
                          <span className="text-zinc-400">·</span>
                          <span
                            className={
                              approval.status === "APPROVED"
                                ? "text-emerald-600"
                                : approval.status === "REJECTED"
                                ? "text-rose-600"
                                : "text-amber-600"
                            }
                          >
                            {approval.status === "APPROVED"
                              ? "Approved"
                              : approval.status === "REJECTED"
                              ? "Rejected"
                              : "Pending"}
                          </span>
                          {approval.decidedAt && (
                            <>
                              <span className="text-zinc-400">·</span>
                              <span className="text-zinc-400">
                                {new Date(approval.decidedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Require all indicator */}
                  {step.requireAll && step.approverIds.length > 1 && (
                    <p className="mt-2 text-[11.5px] text-zinc-400 italic">
                      All {step.approverIds.length} approvers must approve
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
