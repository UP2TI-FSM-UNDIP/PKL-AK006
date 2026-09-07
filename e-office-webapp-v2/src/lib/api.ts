import { treaty } from '@elysiajs/eden';
import type { App } from '@backend/autogen.routes';

const backendOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, '') || 'localhost:20022';
export const client = treaty<App>(backendOrigin);

// API base URL - includes sub-path prefix so Apache can proxy correctly
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const API_BASE_URL = `${BASE_PATH}/api`;

// Token management for Bearer auth
const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Standard headers for API calls - includes Bearer token when available
export function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to safely handle API responses
async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    // Try to extract error message from response body
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        if (errorData.message) {
          return { success: false, message: errorData.message };
        }
      } else {
        const text = await res.text();
        console.error(`Non-JSON error response (status ${res.status}):`, text);
        return { success: false, message: `Server error (${res.status}): ${res.statusText}` };
      }
    } catch (e) {
      console.error("Failed to parse error response:", e);
    }

    if (res.status === 401) {
      return { success: false, message: 'Silakan login terlebih dahulu' };
    }
    if (res.status === 404) {
      return { success: false, message: 'Data tidak ditemukan' };
    }
    return { success: false, message: `Error: ${res.status}` };
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    try {
      const text = await res.text();
      console.error("Expected JSON but received:", text);
    } catch (e) {
      console.error("Failed to read non-JSON response body");
    }
    return { success: false, message: 'Invalid response format from server' };
  }

  try {
    return await res.json();
  } catch (e) {
    console.error("JSON parse error:", e);
    return { success: false, message: 'Invalid response from server' };
  }
}


// Typed API response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Letter types
export interface LetterAttachment {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType?: string;
  size?: number;
}

export interface LetterInstance {
  id: string;
  schema: any;
  values: any;
  templateConfig?: AK006TemplateConfig | null; // Snapshot of template at creation time
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'REVISION';
  currentStep: number;
  temporaryAgenda?: string;
  letterNumber?: string;
  signatureUrl?: string;
  finalDocumentUrl?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt?: string;
  letterType: {
    id: string;
    name: string;
    description?: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    mahasiswa?: {
      nim: string;
      departemen?: { id?: string; name: string; code?: string };
      programStudi?: { id?: string; name: string; code?: string };
    };
  };
  approvalSteps: ApprovalStep[];
  attachments?: LetterAttachment[];
}

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION';
  comments?: string;
  actorRole?: string;
  createdAt: string;
  updatedAt?: string;
  actor?: {
    id: string;
    name: string;
  };
}

// Timeline types
export interface TimelineStep {
  step: number;
  role: string;
  roleName: string;
  actor?: string | null;
  action: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION';
  statusLabel: string;
  date?: string | null;
  comments?: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
  isRejected: boolean;
  isRevision: boolean;
  isFuture?: boolean;
  revisionTargetStep?: number | null;
  revisionTargetRole?: string | null;
}

// Letter API functions
export const letterApi = {
  // Get AK006 template config (public — no superadmin role required)
  // Always bust cache with timestamp to ensure latest template is fetched
  async getAK006TemplatePublic(): Promise<ApiResponse<{ config: AK006TemplateConfig }>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/public/template/ak006?_t=${Date.now()}`, {
      headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  // File upload
  async uploadFile(file: File, category?: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    return handleResponse(res);
  },

  // Mahasiswa endpoints
  async getMyLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006/my`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async getLetterById(id: string): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006/${id}`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async getLetterTimeline(id: string): Promise<ApiResponse<TimelineStep[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006/${id}/timeline`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async createLetter(data: Record<string, any>): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateLetter(
    id: string,
    data: Record<string, any>
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Cancel letter (mahasiswa only, for pending letters)
  async cancelLetter(id: string): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // SA endpoints
  async getSAPendingLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/pending`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getSAProcessedLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/processed`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getSALetterById(id: string): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/${id}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getSALetterTimeline(id: string): Promise<ApiResponse<TimelineStep[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/${id}/timeline`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async verifyLetter(
    id: string,
    action: 'approve' | 'reject' | 'revision',
    comments?: string
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/${id}/verify`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ action, comments }),
    });
    return handleResponse(res);
  },

  async updateSALetter(
    id: string,
    data: Record<string, any>
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateSAStudentData(
    id: string,
    data: {
      name?: string;
      email?: string;
      nim?: string;
      departemenId?: string;
      programStudiId?: string;
    }
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-sa/${id}/student`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // MTU endpoints
  async getMTUPendingLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/pending`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async getMTUProcessedLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/processed`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async getMTULetterById(id: string): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/${id}`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async getMTULetterTimeline(id: string): Promise<ApiResponse<TimelineStep[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/${id}/timeline`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async signLetter(
    id: string,
    signatureId?: string,
    signatureUrl?: string,
    comments?: string
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/${id}/sign`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ signatureId, signatureUrl, comments }),
    });
    return handleResponse(res);
  },

  async reviseLetterMTU(
    id: string,
    comments: string,
    targetStep: number
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/${id}/revise`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ comments, targetStep }),
    });
    return handleResponse(res);
  },

  async rejectLetterMTU(
    id: string,
    comments: string
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/${id}/reject`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    return handleResponse(res);
  },

  async forwardLetterMTU(
    id: string,
    comments?: string
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-mtu/${id}/forward`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    return handleResponse(res);
  },

  // UPA endpoints
  async getUPAPendingLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/pending`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getUPAProcessedLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/processed`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getUPALetterById(id: string): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/${id}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getUPALetterTimeline(id: string): Promise<ApiResponse<TimelineStep[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/${id}/timeline`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getArchivedLetters(): Promise<ApiResponse<LetterInstance[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/archive`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async finalizeLetter(
    id: string,
    data?: { letterNumber?: string; letterDate?: string; comments?: string }
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();

    // Build request body only with defined values
    const body: Record<string, string> = {};
    if (data?.letterNumber) body.letterNumber = data.letterNumber;
    if (data?.letterDate) body.letterDate = data.letterDate;
    if (data?.comments) body.comments = data.comments;

    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/${id}/finalize`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  async rejectLetterUPA(
    id: string,
    comments: string
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/${id}/reject`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    return handleResponse(res);
  },

  async reviseLetterUPA(
    id: string,
    comments: string,
    targetStep: number
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/${id}/revise`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ comments, targetStep }),
    });
    return handleResponse(res);
  },

  async updateUPALetter(
    id: string,
    data: Record<string, any>
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/ak006-upa/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// Public reference data API (departemen, prodi — accessible by any user)
export const referenceApi = {
  async getDepartemen(): Promise<ApiResponse<{ id: string; name: string; code: string }[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/public/reference/departemen`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getProgramStudi(departemenId?: string): Promise<ApiResponse<{ id: string; name: string; code: string; departemenId: string }[]>> {
    const headers = getHeaders();
    const params = departemenId ? `?departemenId=${departemenId}` : '';
    const res = await fetch(`${API_BASE_URL}/public/reference/prodi${params}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

// Signature API functions
export const signatureApi = {
  async getMySignatures(): Promise<ApiResponse<any[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/signature/my`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async createSignature(
    imageUrl: string,
    isDefault?: boolean
  ): Promise<ApiResponse<any>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/signature`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ imageUrl, isDefault }),
    });
    return handleResponse(res);
  },

  async setDefaultSignature(id: string): Promise<ApiResponse<any>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/signature/${id}/default`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async deleteSignature(id: string): Promise<ApiResponse<any>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/signature/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

// Helper functions
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Menunggu Verifikasi',
    IN_PROGRESS: 'Dalam Proses',
    COMPLETED: 'Selesai',
    REJECTED: 'Ditolak',
    REVISION: 'Perlu Revisi',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#FFD600',
    IN_PROGRESS: '#3B82F6',
    COMPLETED: '#4ADE80',
    REJECTED: '#FF5A5A',
    REVISION: '#FB923C',
  };
  return colors[status] || '#B0B0B0';
}

export function getStepLabel(step: number): string {
  const labels: Record<number, string> = {
    0: 'Mahasiswa',
    1: 'Supervisor Akademik',
    2: 'Manajer TU',
    3: 'UPA',
  };
  return labels[step] || `Step ${step}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  letterInstanceId?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
  letterInstance?: {
    id: string;
    letterType: {
      name: string;
    };
    createdBy: {
      name: string;
    };
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

// Notification API functions
export const notificationApi = {
  async getNotifications(limit = 20, unreadOnly = false): Promise<ApiResponse<NotificationResponse>> {
    const headers = getHeaders();
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');

    const res = await fetch(`${API_BASE_URL}/notification?${params.toString()}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/notification/unread-count`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/notification/${notificationId}/read`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async markAllAsRead(): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/notification/read-all`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/notification/${notificationId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },
};


export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface StudyProgram {
  id: string;
  name: string;
  code: string;
  departemenId: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  roles: string[];
  mahasiswa?: {
    nim: string;
    angkatan?: string;
    status?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    noHp?: string;
    alamat?: string;
    departemen?: Department;
    programStudi?: StudyProgram;
  };
  pegawai?: {
    nip: string;
    departemen?: Department;
    programStudi?: StudyProgram;
  };
}

export const userApi = {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/me`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async updateProfile(data: { image?: string }): Promise<ApiResponse<UserProfile>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/me`, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async changePassword(data: { currentPassword?: string; newPassword: string }): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/me/password`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// Superadmin API types
export interface SuperadminStats {
  letters: {
    total: number;
    pending: number;
    completed: number;
    rejected: number;
    inProgress: number;
    byStep: {
      mahasiswaStep: number;
      saStep: number;
      mtuStep: number;
      upaStep: number;
    };
  };
  monthly: {
    total: number;
    completed: number;
    pending: number;
  };
  users: {
    total: number;
    mahasiswa: number;
    pegawai: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SuperadminUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: boolean;
  createdAt?: string;
  deletedAt?: string | null;
  roles: string[];
  mahasiswa?: {
    id: string;
    nim: string;
    tahunMasuk: string;
    noHp: string;
    departemen?: { id: string; name: string; code: string };
    programStudi?: { id: string; name: string; code: string };
  };
  pegawai?: {
    id: string;
    nip: string;
    jabatan: string;
    departemen?: { id: string; name: string; code: string };
    programStudi?: { id: string; name: string; code: string };
  };
  userRole?: Array<{ role: { id: string; name: string } }>;
}

export interface RoleInfo {
  id: string;
  name: string;
  permissions: Array<{
    permission: {
      id: string;
      resource: string;
      action: string;
    };
  }>;
  _count: { users: number };
}

export interface ImpersonationData {
  user: SuperadminUser;
  impersonatedBy: {
    id: string;
    name: string;
  };
}

// AK006 Template types
export interface AK006TemplateConfig {
  // Header
  kementerian: string;
  universitas: string;
  fakultas: string;
  alamat: string;
  kampus: string;
  kota: string;
  telepon: string;
  website: string;
  email: string;
  // Reference info
  lampiran_surat: string;
  nomor_ref_1: string;
  nomor_ref_2: string;
  tanggal_ref: string;
  // Signer
  signer_name: string;
  signer_nip: string;
  signer_pangkat: string;
  signer_jabatan: string;
  signer_instansi: string;
  // Letter format
  letter_number_format: string;
  letter_title: string;
  signer_atas_nama: string;
  signer_untuk_beliau: string;
}

export interface AK006TemplateData {
  id: string | null;
  letterTypeId: string | null;
  versionName?: string;
  config: AK006TemplateConfig;
}

// Superadmin API functions
export const superadminApi = {
  // Dashboard stats
  async getStats(): Promise<ApiResponse<SuperadminStats>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/stats`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Letters management
  async getAllLetters(params?: {
    page?: number;
    limit?: number;
    status?: string;
    role?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<PaginatedResponse<LetterInstance>> {
    const headers = getHeaders();
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params?.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters?${searchParams.toString()}`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res) as Promise<PaginatedResponse<LetterInstance>>;
  },

  async getLetterById(id: string): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters/${id}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async getLetterTimeline(id: string): Promise<ApiResponse<TimelineStep[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters/${id}/timeline`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async updateLetter(
    id: string,
    data: {
      values?: Record<string, any>;
      status?: string;
      currentStep?: number;
      letterNumber?: string;
    }
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async forceApproveLetter(
    id: string,
    data?: { comments?: string; letterNumber?: string; letterDate?: string; signatureUrl?: string }
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters/${id}/force-approve`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data || {}),
    });
    return handleResponse(res);
  },

  async forceRejectLetter(
    id: string,
    comments: string
  ): Promise<ApiResponse<LetterInstance>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters/${id}/force-reject`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ comments }),
    });
    return handleResponse(res);
  },

  async deleteLetter(id: string): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/letters/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // User management
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    type?: string;
  }): Promise<PaginatedResponse<SuperadminUser>> {
    const headers = getHeaders();
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.type) searchParams.append('type', params.type);

    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users?${searchParams.toString()}`, {
      headers: { ...headers, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res) as Promise<PaginatedResponse<SuperadminUser>>;
  },

  async getUserById(id: string): Promise<ApiResponse<SuperadminUser>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/${id}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async updateUser(
    id: string,
    data: { name?: string; email?: string }
  ): Promise<ApiResponse<SuperadminUser>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/${id}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/${userId}/reset-password`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ newPassword }),
    });
    return handleResponse(res);
  },

  async assignRole(userId: string, role: string): Promise<ApiResponse<{ roles: string[] }>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/${userId}/roles`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  async removeRole(userId: string, roleName: string): Promise<ApiResponse<{ roles: string[] }>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/${userId}/roles/${roleName}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/${id}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Roles
  async getAllRoles(): Promise<ApiResponse<RoleInfo[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/roles`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Impersonation
  async impersonateUser(userId: string): Promise<ApiResponse<ImpersonationData>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/impersonate/${userId}`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // AK006 Template management
  async getAK006Template(): Promise<ApiResponse<AK006TemplateData>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/template/ak006?_t=${Date.now()}`, {
      headers: { ...headers, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  async updateAK006Template(
    config: AK006TemplateConfig,
    versionName?: string
  ): Promise<ApiResponse<AK006TemplateData>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/template/ak006`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ config, versionName }),
    });
    return handleResponse(res);
  },

  // Create mahasiswa user
  async createMahasiswa(data: {
    name: string;
    email: string;
    password?: string;
    nim: string;
    tahunMasuk: string;
    noHp: string;
    alamat?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    departemenId: string;
    programStudiId: string;
  }): Promise<ApiResponse<SuperadminUser>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/mahasiswa`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Create pegawai user
  async createPegawai(data: {
    name: string;
    email: string;
    password?: string;
    nip: string;
    jabatan: string;
    role: string;
    noHp?: string;
  }): Promise<ApiResponse<SuperadminUser>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/users/pegawai`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Get departemen list
  async getDepartemen(): Promise<ApiResponse<{ id: string; name: string; code: string }[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/departemen`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Get program studi list (optionally filtered by departemenId)
  async getProgramStudi(departemenId?: string): Promise<ApiResponse<{ id: string; name: string; code: string; departemenId: string }[]>> {
    const headers = getHeaders();
    const params = departemenId ? `?departemenId=${departemenId}` : '';
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/prodi${params}`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },

  // Get MTU signatures
  async getMTUSignatures(): Promise<ApiResponse<any[]>> {
    const headers = getHeaders();
    const res = await fetch(`${API_BASE_URL}/letter/superadmin/signatures/mtu`, {
      headers,
      credentials: 'include',
    });
    return handleResponse(res);
  },
};
