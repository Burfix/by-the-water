// ─── Audit Templates ──────────────────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type QuestionResult = 'YES' | 'NO' | 'NA';

export interface TemplateQuestion {
  id: string;
  text: string;
  riskLevel: RiskLevel;
  requiresPhoto: boolean;
  requiresNotes: boolean;
  weight: number; // 1–10 for scoring
  sortOrder: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  questions: TemplateQuestion[];
  sortOrder: number;
}

export interface AuditTemplate {
  id: string;
  name: string;
  description?: string;
  sections: TemplateSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionResponse {
  questionId: string;
  result: QuestionResult | null;
  notes: string;
  photoDataUrls: string[];
}

export interface ConductedAudit {
  auditId: string;
  templateId: string;
  responses: Record<string, QuestionResponse>;
  startedAt: string;
  submittedAt?: string;
  score?: number;
}

// ─── Roles ────────────────────────────────────────────────────────────────────
export enum Role {
  STORE = 'STORE',
  PROPERTY_COORDINATOR = 'PROPERTY_COORDINATOR',
  OPS_MANAGER = 'OPS_MANAGER',
  EXEC = 'EXEC',
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export enum AuditStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AuditItemResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  phone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Precinct {
  id: string;
  name: string;
  region?: string;
  description?: string;
  isActive: boolean;
  storeCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Store {
  id: string;
  name: string;
  storeCode: string;
  address?: string;
  city?: string;
  email?: string;
  phone?: string;
  precinctId: string;
  precinct?: Precinct;
  complianceScore?: number;
  isActive: boolean;
  assignments?: StoreAssignment[];
  createdAt?: string;
}

export interface StoreAssignment {
  id: string;
  userId: string;
  user?: User;
  storeId: string;
  store?: Store;
  isActive: boolean;
  assignedAt: string;
}

export interface AuditItem {
  id: string;
  auditId: string;
  category: string;
  question: string;
  result: AuditItemResult;
  weight: number;
  notes?: string;
  sortOrder: number;
}

export interface AuditPhoto {
  id: string;
  auditId: string;
  auditItemId?: string;
  s3Key: string;
  s3Bucket: string;
  fileName: string;
  mimeType: string;
  caption?: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface Audit {
  id: string;
  storeId: string;
  store?: Store;
  auditorId?: string;
  auditor?: User;
  assignedToId?: string;
  assignedTo?: User;
  createdById?: string;
  createdBy?: User;
  approvedById?: string;
  approvedBy?: User;
  status: AuditStatus;
  scheduledDate: string;
  completedDate?: string;
  complianceScore?: number;
  notes?: string;
  rejectionReason?: string;
  auditType?: string;
  title?: string;
  items?: AuditItem[];
  photos?: AuditPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  storeId: string;
  store?: Store;
  certificateType: string;
  issueDate: string;
  expiryDate: string;
  s3Key?: string;
  s3Bucket?: string;
  fileName?: string;
  mimeType?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
  isActive: boolean;
  uploadedBy?: User;
  createdAt: string;
}

export type NotificationType =
  | 'CERTIFICATE_EXPIRY_WARNING'
  | 'CERTIFICATE_EXPIRY_CRITICAL'
  | 'CERTIFICATE_EXPIRED'
  | 'AUDIT_SCHEDULED'
  | 'AUDIT_SUBMITTED'
  | 'AUDIT_APPROVED'
  | 'AUDIT_REJECTED'
  | 'COORDINATOR_ASSIGNED'
  | 'COMPLIANCE_SCORE_LOW'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId?: string;
  storeId?: string;
  type: NotificationType;
  title?: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// ─── API Response Wrappers ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardMetrics {
  totalStores: number;
  totalAudits: number;
  pendingAudits: number;
  approvedAudits: number;
  avgComplianceScore: number;
  expiringCertificates: number;
  expiredCertificates: number;
  totalCoordinators: number;
  auditsByStatus: { status: string; count: number }[];
  topStores: Store[];
  lowStores: Store[];
  recentAudits: Audit[];
  complianceTrend: { month: string; avgScore: number; auditCount: number }[];
}
