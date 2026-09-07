"use client";

import { useEffect, useState } from "react";
import { letterApi, superadminApi, TimelineStep } from "@/lib/api";
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LetterTimelineProps {
  letterId: string;
  role?: 'mahasiswa' | 'sa' | 'mtu' | 'upa' | 'superadmin';
  className?: string;
  refreshKey?: number; // Increment this to trigger a refresh
}

export function LetterTimeline({ letterId, role = 'mahasiswa', className, refreshKey = 0 }: LetterTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        setLoading(true);
        let response;

        // Use different API endpoints based on role
        switch (role) {
          case 'sa':
            response = await letterApi.getSALetterTimeline(letterId);
            break;
          case 'mtu':
            response = await letterApi.getMTULetterTimeline(letterId);
            break;
          case 'upa':
            response = await letterApi.getUPALetterTimeline(letterId);
            break;
          case 'superadmin':
            response = await superadminApi.getLetterTimeline(letterId);
            break;
          default:
            response = await letterApi.getLetterTimeline(letterId);
        }

        if (response.success && response.data) {
          setTimeline(response.data);
        } else {
          setError(response.message || "Gagal memuat riwayat surat");
        }
      } catch (err) {
        setError("Terjadi kesalahan saat memuat riwayat");
      } finally {
        setLoading(false);
      }
    }

    if (letterId) {
      fetchTimeline();
    }
  }, [letterId, role, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">Memuat riwayat...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500 dark:text-red-400 transition-colors">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors">
        Belum ada riwayat untuk surat ini
      </div>
    );
  }

  const getStepIcon = (step: TimelineStep) => {
    if (step.isCompleted) {
      return <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />;
    }
    if (step.isRejected) {
      return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
    }
    if (step.isRevision) {
      return <AlertCircle className="h-5 w-5 text-orange-500 dark:text-orange-400" />;
    }
    if (step.isCurrent) {
      return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-pulse" />;
    }
    if (step.isFuture) {
      return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />;
    }
    return <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
  };

  const getStatusBadge = (step: TimelineStep, index: number) => {
    const baseClasses = "text-xs px-2 py-0.5 rounded-full font-medium";

    if (step.isCompleted) {
      // Check if this approval is a response to a revision
      let label = step.statusLabel;

      // If this is a student step (0) and NOT the first item in timeline, it's an update/revision
      if (step.step === 0 && index > 0) {
        label = "Direvisi";
      }

      if (index > 0) {
        const prevStep = timeline[index - 1];
        // If previous step was a Revision AND it came from a higher step (e.g. MTU->SA)
        if (prevStep.status === 'REVISION' && prevStep.step > step.step) {
          label = "Direvisi";
        }
      }

      return (
        <span className={cn(baseClasses, "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 transition-colors")}>
          {label}
        </span>
      );
    }
    if (step.isRejected) {
      return (
        <span className={cn(baseClasses, "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 transition-colors")}>
          {step.statusLabel}
        </span>
      );
    }
    if (step.isRevision) {
      // Show revision target if available
      const revisionLabel = step.revisionTargetRole
        ? `${step.statusLabel} → ${step.revisionTargetRole}`
        : step.statusLabel;
      return (
        <span className={cn(baseClasses, "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 transition-colors")}>
          {revisionLabel}
        </span>
      );
    }
    if (step.isCurrent) {
      return (
        <span className={cn(baseClasses, "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors")}>
          {step.statusLabel}
        </span>
      );
    }
    if (step.isFuture) {
      return (
        <span className={cn(baseClasses, "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors")}>
          Belum Dimulai
        </span>
      );
    }
    return (
      <span className={cn(baseClasses, "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors")}>
        {step.statusLabel}
      </span>
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={cn("", className)}>
      <div className="relative">
        {timeline.map((step, index) => (
          <div key={`${step.step}-${index}`} className="relative pb-8 last:pb-0">
            {/* Connector line */}
            {index !== timeline.length - 1 && (
              <div
                className={cn(
                  "absolute left-[9px] top-5 w-0.5 h-full -bottom-2 transition-colors",
                  step.isCompleted ? "bg-green-300 dark:bg-green-700" :
                    step.isRejected ? "bg-red-200 dark:bg-red-800" :
                      step.isRevision ? "bg-orange-200 dark:bg-orange-800" :
                        "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}

            <div className="relative flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={cn(
                    "font-medium text-sm transition-colors",
                    step.isFuture ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {step.role}
                  </h4>
                  {getStatusBadge(step, index)}
                </div>

                <p className={cn(
                  "text-xs mt-0.5 transition-colors",
                  step.isFuture ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
                )}>
                  {step.action}
                </p>

                {step.actor && !step.isFuture && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                    <span className="font-medium">Oleh:</span> {step.actor}
                    {step.roleName && ` (${step.roleName})`}
                  </p>
                )}

                {step.date && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 transition-colors">
                    {formatDate(step.date)}
                  </p>
                )}

                {step.comments && (
                  <div className={cn(
                    "mt-2 text-xs p-2 rounded-md border-l-2 transition-colors",
                    step.isRejected
                      ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                      : step.isRevision
                        ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  )}>
                    <span className="font-medium">Catatan:</span> {step.comments}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LetterTimeline;
