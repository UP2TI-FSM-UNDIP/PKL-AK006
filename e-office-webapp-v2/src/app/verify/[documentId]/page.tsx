'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useParams } from 'next/navigation';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Loader2,
  Shield,
  Circle
} from 'lucide-react';

// Types - matching the new API format
interface TimelineStep {
  step: number;
  role: string;
  roleName: string;
  actor?: string | null;
  action: string;
  status: string;
  statusLabel: string;
  date?: string | null;
  comments?: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isRejected: boolean;
  isRevision: boolean;
  isFuture?: boolean;
}

interface VerificationData {
  documentId: string;
  letterNumber: string | null;
  letterType: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  studentName: string;
  studentNim: string;
  programStudi: string;
  departemen: string;
  timeline: TimelineStep[];
  verifiedAt: string;
  isValid: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: VerificationData;
  message?: string;
}

// Status mapping
const statusMap: Record<string, { label: string; bgColor: string; textColor: string }> = {
  'COMPLETED': { label: 'Selesai', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  'PENDING': { label: 'Menunggu', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  'IN_PROGRESS': { label: 'Dalam Proses', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  'REJECTED': { label: 'Ditolak', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  'APPROVED': { label: 'Disetujui', bgColor: 'bg-green-100', textColor: 'text-green-700' },
};

export default function DocumentVerificationPage() {
  const params = useParams();
  const documentId = params?.documentId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyDocument() {
      if (!documentId) {
        setError('ID dokumen tidak valid');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/public/verify/${documentId}`);
        const result: ApiResponse = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || 'Dokumen tidak ditemukan');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Gagal memverifikasi dokumen. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }

    verifyDocument();
  }, [documentId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
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

  // Get step icon based on status
  const getStepIcon = (step: TimelineStep) => {
    if (step.isCompleted) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (step.isRejected) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (step.isRevision) {
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
    if (step.isCurrent) {
      return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    }
    if (step.isFuture) {
      return <Circle className="h-5 w-5 text-gray-300" />;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  // Get status badge
  const getStatusBadge = (step: TimelineStep, index: number, timeline: TimelineStep[]) => {
    const baseClasses = "text-xs px-2 py-0.5 rounded-full font-medium";

    if (step.isCompleted) {
      let label = step.statusLabel;
      // Check if this is a revision response
      if (index > 0) {
        const prevStep = timeline[index - 1];
        if (prevStep.status === 'REVISION' && prevStep.step > step.step) {
          label = "Direvisi";
        }
      }
      return (
        <span className={`${baseClasses} bg-green-100 text-green-700`}>
          {label}
        </span>
      );
    }
    if (step.isRejected) {
      return (
        <span className={`${baseClasses} bg-red-100 text-red-700`}>
          {step.statusLabel}
        </span>
      );
    }
    if (step.isRevision) {
      return (
        <span className={`${baseClasses} bg-orange-100 text-orange-700`}>
          {step.statusLabel}
        </span>
      );
    }
    if (step.isCurrent) {
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-700`}>
          {step.statusLabel}
        </span>
      );
    }
    if (step.isFuture) {
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-500`}>
          Belum Dimulai
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-gray-100 text-gray-600`}>
        {step.statusLabel}
      </span>
    );
  };

  // Get connector line color
  const getConnectorColor = (step: TimelineStep) => {
    if (step.isCompleted) return "bg-green-300";
    if (step.isRejected) return "bg-red-200";
    if (step.isRevision) return "bg-orange-200";
    return "bg-gray-200";
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Memverifikasi dokumen...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-6 text-center border border-gray-200">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Dokumen Tidak Ditemukan</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const statusInfo = statusMap[data.status] || { label: data.status, bgColor: 'bg-gray-100', textColor: 'text-gray-700' };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-block mb-3">
            <img
              src={`${BASE_PATH}/template/Logo_Universitas_Diponegoro.png`}
              alt="Logo UNDIP"
              width={60}
              height={60}
              className="mx-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Verifikasi Dokumen</h1>
          <p className="text-gray-500 text-sm">e-Office FSM UNDIP</p>
        </div>

        {/* Verification Badge */}
        {data.isValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Dokumen Terverifikasi</p>
              <p className="text-green-600 text-sm">Dokumen ini sah dan terdaftar di sistem</p>
            </div>
          </div>
        )}

        {/* Main Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Jenis Surat */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Jenis Surat</span>
              <span className="font-medium text-gray-900">{data.letterType}</span>
            </div>

            {/* Nomor Surat */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Nomor Surat</span>
              <span className="font-medium text-gray-900">{data.letterNumber || '-'}</span>
            </div>

            {/* Tanggal */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Tanggal</span>
              <span className="font-medium text-gray-900">{formatDate(data.createdAt)}</span>
            </div>

            <hr className="border-gray-100" />

            {/* Pengaju */}
            <div>
              <p className="text-gray-500 text-sm mb-1">Diajukan Oleh</p>
              <p className="font-medium text-gray-900">{data.studentName}</p>
              <p className="text-gray-500 text-sm">{data.studentNim} • {data.programStudi}</p>
            </div>
          </div>
        </div>

        {/* Timeline - Same format as detail-surat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Riwayat Surat</h2>

          <div className="relative">
            {data.timeline && data.timeline.map((step, index) => (
              <div key={`${step.step}-${index}`} className="relative pb-8 last:pb-0">
                {/* Connector line */}
                {index !== data.timeline.length - 1 && (
                  <div
                    className={`absolute left-[9px] top-5 w-0.5 h-full -bottom-2 ${getConnectorColor(step)}`}
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
                      <h4 className={`font-medium text-sm ${step.isFuture ? "text-gray-400" : "text-gray-900"}`}>
                        {step.role}
                      </h4>
                      {getStatusBadge(step, index, data.timeline)}
                    </div>

                    <p className={`text-xs mt-0.5 ${step.isFuture ? "text-gray-300" : "text-gray-500"}`}>
                      {step.action}
                    </p>

                    {step.actor && !step.isFuture && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Oleh:</span> {step.actor}
                        {step.roleName && ` (${step.roleName})`}
                      </p>
                    )}

                    {step.date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(step.date)}
                      </p>
                    )}

                    {step.comments && (
                      <div className={`mt-2 text-xs p-2 rounded-md border-l-2 ${step.isRejected
                          ? "bg-red-50 border-red-300 text-red-700"
                          : step.isRevision
                            ? "bg-orange-50 border-orange-300 text-orange-700"
                            : "bg-gray-50 border-gray-300 text-gray-600"
                        }`}>
                        <span className="font-medium">Catatan:</span> {step.comments}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-xs">
            Jika informasi berbeda dengan dokumen fisik, dokumen dianggap <strong>tidak sah</strong>.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs">
          ID: {data.documentId}
        </p>
      </div>
    </div>
  );
}
