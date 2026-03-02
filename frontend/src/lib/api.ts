import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse, PaginatedResult, DashboardMetrics, Audit, Store, Certificate, Notification, User, Precinct, AuditItem } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set. Check your .env file.');
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true, // send httpOnly cookies on every request
});

// ── Response interceptor – handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Attempt one silent token refresh on 401, then redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

// ─── Helper ───────────────────────────────────────────────────────────────────
function unwrap<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User }>>('/auth/login', { email, password }).then(unwrap),

  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', data).then(unwrap),

  refresh: () =>
    api.post<ApiResponse<{ user: User }>>('/auth/refresh').then(unwrap),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () => api.get<ApiResponse<User>>('/auth/me').then(unwrap),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getMetrics: () => api.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics').then(unwrap),
  getPrecinctSummary: () =>
    api.get<ApiResponse<{ precinctName: string; storeCount: number; avgScore: number }[]>>(
      '/dashboard/precinct-summary',
    ).then(unwrap),
};

// ─── Stores ───────────────────────────────────────────────────────────────────
export const storesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Store>>>('/stores', { params }).then(unwrap),

  getGroupedByPrecinct: () =>
    api.get<ApiResponse<{ precinctId: string; precinctName: string; stores: Store[] }[]>>(
      '/stores/grouped-by-precinct',
    ).then(unwrap),

  getMyStore: () => api.get<ApiResponse<Store>>('/stores/my-store').then(unwrap),

  getById: (id: string) => api.get<ApiResponse<Store>>(`/stores/${id}`).then(unwrap),

  create: (data: Partial<Store>) => api.post<ApiResponse<Store>>('/stores', data).then(unwrap),

  update: (id: string, data: Partial<Store>) =>
    api.put<ApiResponse<Store>>(`/stores/${id}`, data).then(unwrap),

  assignCoordinator: (storeId: string, coordinatorId: string) =>
    api.post<ApiResponse<unknown>>(`/stores/${storeId}/assign-coordinator`, { coordinatorId }).then(unwrap),
};

// ─── Audits ───────────────────────────────────────────────────────────────────
export const auditsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Audit>>>('/audits', { params }).then(unwrap),

  getById: (id: string) => api.get<ApiResponse<Audit>>(`/audits/${id}`).then(unwrap),

  create: (data: Partial<Audit>) => api.post<ApiResponse<Audit>>('/audits', data).then(unwrap),

  update: (id: string, data: Partial<Audit>) =>
    api.put<ApiResponse<Audit>>(`/audits/${id}`, data).then(unwrap),

  start: (id: string) => api.patch<ApiResponse<Audit>>(`/audits/${id}/start`).then(unwrap),
  submit: (id: string) => api.patch<ApiResponse<Audit>>(`/audits/${id}/submit`).then(unwrap),
  approve: (id: string) => api.patch<ApiResponse<Audit>>(`/audits/${id}/approve`).then(unwrap),

  reject: (id: string, reason: string) =>
    api.patch<ApiResponse<Audit>>(`/audits/${id}/reject`, { reason }).then(unwrap),

  addItems: (auditId: string, items: Partial<AuditItem>[]) =>
    api.post<ApiResponse<AuditItem[]>>(`/audits/${auditId}/items`, items).then(unwrap),

  getPhotos: (auditId: string) =>
    api.get<ApiResponse<unknown[]>>(`/audits/${auditId}/photos`).then(unwrap),

  getPhotoUploadUrl: (auditId: string, fileName: string, mimeType: string) =>
    api.post<ApiResponse<{ uploadUrl: string; s3Key: string; s3Bucket: string }>>(
      `/audits/${auditId}/photos/upload-url`,
      { fileName, mimeType },
    ).then(unwrap),
};

// ─── Certificates ─────────────────────────────────────────────────────────────
export const certificatesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Certificate>>>('/certificates', { params }).then(unwrap),

  getByStore: (storeId: string, params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Certificate>>>(`/certificates/store/${storeId}`, { params }).then(unwrap),

  getExpiring: (days = 30) =>
    api.get<ApiResponse<Certificate[]>>('/certificates/expiring', { params: { days } }).then(unwrap),

  getExpired: () => api.get<ApiResponse<Certificate[]>>('/certificates/expired').then(unwrap),

  getById: (id: string) => api.get<ApiResponse<Certificate>>(`/certificates/${id}`).then(unwrap),

  getDownloadUrl: (id: string) =>
    api.get<ApiResponse<{ url: string }>>(`/certificates/${id}/download-url`).then(unwrap),

  getUploadUrl: (storeId: string, fileName: string, mimeType: string) =>
    api.post<ApiResponse<{ uploadUrl: string; s3Key: string; s3Bucket: string }>>(
      '/certificates/upload-url',
      { storeId, fileName, mimeType },
    ).then(unwrap),

  create: (data: Partial<Certificate>) =>
    api.post<ApiResponse<Certificate>>('/certificates', data).then(unwrap),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Notification>>>('/notifications', { params }).then(unwrap),

  getUnreadCount: () => api.get<ApiResponse<number>>('/notifications/unread-count').then(unwrap),

  markRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`).then(unwrap),

  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<User>>>('/users', { params }).then(unwrap),

  getCoordinators: () => api.get<ApiResponse<User[]>>('/users/coordinators').then(unwrap),

  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`).then(unwrap),

  create: (data: Partial<User> & { password: string }) =>
    api.post<ApiResponse<User>>('/users', data).then(unwrap),

  update: (id: string, data: Partial<User>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data).then(unwrap),
};

// ─── Precincts ────────────────────────────────────────────────────────────────
export const precinctsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<PaginatedResult<Precinct>>>('/precincts', { params }).then(unwrap),

  getById: (id: string) => api.get<ApiResponse<Precinct>>(`/precincts/${id}`).then(unwrap),

  create: (data: Partial<Precinct>) =>
    api.post<ApiResponse<Precinct>>('/precincts', data).then(unwrap),

  update: (id: string, data: Partial<Precinct>) =>
    api.put<ApiResponse<Precinct>>(`/precincts/${id}`, data).then(unwrap),
};

export default api;
