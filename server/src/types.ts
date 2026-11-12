export type UserRole = 'employee' | 'manager' | 'finance' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  organizationId: string;
  avatarUrl?: string;
  jobTitle?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Travel'
  | 'Accommodation'
  | 'Meals & Entertainment'
  | 'Office Supplies'
  | 'Software & Subscriptions'
  | 'Transportation'
  | 'Client Meetings'
  | 'Training & Education'
  | 'Utilities'
  | 'Groceries & Supplies'
  | 'Other';

export type ComplianceStatus = 'compliant' | 'warning' | 'violation' | 'needs_review';

export interface PolicyCheckResult {
  ruleName: string;
  status: 'passed' | 'warning' | 'violation';
  message: string;
  threshold?: number | string;
  actual?: number | string;
}

export interface AnomalyAssessment {
  riskScore: number; // 0 to 100
  riskLevel: 'Low' | 'Medium' | 'High';
  reasons: string[];
  investigationStatus: 'not_flagged' | 'flagged' | 'under_review' | 'resolved_legitimate' | 'resolved_rejected';
  reviewerNotes?: string;
}

export interface SplitAllocation {
  category: ExpenseCategory;
  department: string;
  project?: string;
  amount: number;
  percentage: number;
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface Expense {
  id: string;
  userId: string;
  userName: string;
  userDepartment: string;
  merchant: string;
  date: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  convertedAmount: number; // in USD base currency
  category: ExpenseCategory;
  categoryReasoning?: string;
  description: string;
  receiptUrl?: string;
  receiptHash?: string;
  ocrConfidence?: number;
  lineItems?: Array<{ description: string; amount: number; quantity?: number }>;
  taxAmount?: number;
  complianceStatus: ComplianceStatus;
  policyChecks: PolicyCheckResult[];
  anomaly: AnomalyAssessment;
  status: ExpenseStatus;
  reportId?: string;
  splits?: SplitAllocation[];
  paymentMethod: 'Corporate Card' | 'Personal Card' | 'Cash';
  isMileage?: boolean;
  mileageDetails?: {
    origin: string;
    destination: string;
    distanceMiles: number;
    ratePerMile: number;
    businessPurpose: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'reimbursement_pending'
  | 'reimbursed'
  | 'rejected'
  | 'changes_requested';

export interface ExpenseReport {
  id: string;
  reportNumber: string;
  title: string;
  userId: string;
  userName: string;
  userDepartment: string;
  startDate: string;
  endDate: string;
  expenseIds: string[];
  totalAmount: number;
  currency: string;
  status: ReportStatus;
  submittedAt?: string;
  approvedAt?: string;
  reimbursedAt?: string;
  reviewerNotes?: string;
  complianceSummary?: {
    compliantCount: number;
    warningCount: number;
    violationCount: number;
  };
  createdAt: string;
}

export interface DepartmentBudget {
  id: string;
  department: string;
  fiscalYear: number;
  month: number; // 1-12
  monthlyAllocation: number;
  allocatedCategories: Record<string, number>;
  spentAmount: number;
  pendingAmount: number;
}

export interface CorporatePolicy {
  id: string;
  name: string;
  category: ExpenseCategory | 'All';
  maxDailyAmount?: number;
  maxSingleAmount?: number;
  allowedFlightClasses?: string[];
  requireReceiptAboveAmount: number;
  isRestrictedCategory: boolean;
  active: boolean;
  description: string;
}

export interface MileageClaim {
  id: string;
  expenseId?: string;
  userId: string;
  userName: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  ratePerMile: number;
  totalReimbursement: number;
  businessPurpose: string;
  travelDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval' | 'policy' | 'anomaly' | 'budget' | 'reimbursement' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'expense' | 'report' | 'policy' | 'budget' | 'user' | 'integration';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface IntegrationStatus {
  id: string;
  providerKey: string;
  name: string;
  category: 'Accounting' | 'ERP' | 'OCR & AI' | 'Services';
  description: string;
  status: 'connected' | 'not_connected' | 'demo_mode' | 'error';
  lastSync?: string;
  configuredBy?: string;
  credentialsRequired: string[];
}
