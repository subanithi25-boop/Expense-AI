import axios from 'axios';
import {
  User,
  Expense,
  ExpenseReport,
  DepartmentBudget,
  CorporatePolicy,
  MileageClaim,
  NotificationItem,
  IntegrationStatus,
  DashboardMetrics,
  ReportStatus
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach token
api.interceptors.request.use(config => {
  // Do not attach stale tokens to public authentication endpoints
  const isPublicAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/register');
  if (isPublicAuthRoute) {
    return config;
  }

  const token = localStorage.getItem('spendwise_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string, role?: string, department?: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password, role, department });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data.user;
  }
};

export const expenseApi = {
  getExpenses: async (params?: { category?: string; status?: string; compliance?: string; search?: string }) => {
    const res = await api.get<{ expenses: Expense[] }>('/expenses', { params });
    return res.data.expenses;
  },
  createExpense: async (data: Partial<Expense>) => {
    const res = await api.post<{ expense: Expense }>('/expenses', data);
    return res.data.expense;
  },
  updateExpense: async (id: string, data: Partial<Expense>) => {
    const res = await api.put<{ expense: Expense }>(`/expenses/${id}`, data);
    return res.data.expense;
  },
  deleteExpense: async (id: string) => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  },
  scanReceipt: async (file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await api.post('/expenses/scan-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  resolveAnomaly: async (id: string, resolution: 'legitimate' | 'rejected', reviewerNotes: string) => {
    const res = await api.post(`/expenses/${id}/resolve-anomaly`, { resolution, reviewerNotes });
    return res.data;
  }
};

export const reportApi = {
  getReports: async () => {
    const res = await api.get<{ reports: ExpenseReport[] }>('/reports');
    return res.data.reports;
  },
  getReportById: async (id: string) => {
    const res = await api.get<{ report: ExpenseReport; expenses: Expense[] }>(`/reports/${id}`);
    return res.data;
  },
  createReport: async (data: { title: string; startDate: string; endDate: string; expenseIds: string[] }) => {
    const res = await api.post<{ report: ExpenseReport }>('/reports', data);
    return res.data.report;
  },
  submitReport: async (id: string) => {
    const res = await api.post<{ report: ExpenseReport }>(`/reports/${id}/submit`);
    return res.data.report;
  },
  transitionReport: async (id: string, status: ReportStatus, reviewerNotes?: string) => {
    const res = await api.post<{ report: ExpenseReport }>(`/reports/${id}/transition`, { status, reviewerNotes });
    return res.data.report;
  }
};

export const approvalApi = {
  getPending: async () => {
    const res = await api.get<{
      pendingExpenses: Expense[];
      pendingReports: ExpenseReport[];
      counts: { expenses: number; reports: number; highRiskCount: number; violationsCount: number };
    }>('/approvals/pending');
    return res.data;
  },
  decideExpense: async (id: string, decision: 'approve' | 'reject' | 'changes_requested', comments?: string, overridePolicyReason?: string) => {
    const res = await api.post(`/approvals/expenses/${id}/decide`, { decision, comments, overridePolicyReason });
    return res.data;
  },
  batchApprove: async (expenseIds: string[], comments?: string) => {
    const res = await api.post('/approvals/batch-approve', { expenseIds, comments });
    return res.data;
  }
};

export const budgetApi = {
  getBudgets: async () => {
    const res = await api.get<{ budgets: DepartmentBudget[] }>('/budgets');
    return res.data.budgets;
  },
  updateBudget: async (id: string, data: { monthlyAllocation: number; allocatedCategories?: Record<string, number> }) => {
    const res = await api.put<{ budget: DepartmentBudget }>(`/budgets/${id}`, data);
    return res.data.budget;
  }
};

export const mileageApi = {
  calculate: async (origin: string, destination: string) => {
    const res = await api.post<{
      origin: string;
      destination: string;
      distanceMiles: number;
      ratePerMile: number;
      estimatedReimbursement: number;
      calculationMethod: string;
    }>('/mileage/calculate', { origin, destination });
    return res.data;
  },
  getClaims: async () => {
    const res = await api.get<{ claims: MileageClaim[] }>('/mileage');
    return res.data.claims;
  },
  submitClaim: async (data: { origin: string; destination: string; distanceMiles: number; businessPurpose: string; travelDate?: string }) => {
    const res = await api.post<{ claim: MileageClaim; expense: Expense }>('/mileage', data);
    return res.data;
  }
};

export const policyApi = {
  getPolicies: async () => {
    const res = await api.get<{ policies: CorporatePolicy[] }>('/policies');
    return res.data.policies;
  },
  updatePolicy: async (id: string, data: Partial<CorporatePolicy>) => {
    const res = await api.put<{ policy: CorporatePolicy }>(`/policies/${id}`, data);
    return res.data.policy;
  }
};

export const integrationApi = {
  getIntegrations: async () => {
    const res = await api.get<{ integrations: IntegrationStatus[] }>('/integrations');
    return res.data.integrations;
  },
  configure: async (providerKey: string, data: { apiKey?: string; clientSecret?: string; isDemoMode?: boolean }) => {
    const res = await api.post<{ success: boolean; integration: IntegrationStatus }>(`/integrations/${providerKey}/configure`, data);
    return res.data.integration;
  },
  sync: async (providerKey: string) => {
    const res = await api.post<{ success: boolean; message: string; syncedAt: string }>(`/integrations/${providerKey}/sync`);
    return res.data;
  },
  disconnect: async (providerKey: string) => {
    const res = await api.post<{ success: boolean; integration: IntegrationStatus }>(`/integrations/${providerKey}/disconnect`);
    return res.data.integration;
  }
};

export const analyticsApi = {
  getDashboardSummary: async () => {
    const res = await api.get<{
      metrics: DashboardMetrics;
      monthlyTrend: Array<{ month: string; amount: number; budget: number }>;
      categoryDistribution: Array<{ name: string; value: number; percentage: number }>;
      departmentSpending: Array<{ department: string; spent: number; budget: number }>;
      aiInsights: Array<{ id: string; type: 'warning' | 'info' | 'success'; message: string; date: string }>;
      recentTransactions: Expense[];
      pendingApprovals: Expense[];
    }>('/analytics/dashboard-summary');
    return res.data;
  }
};

export const notificationApi = {
  getNotifications: async () => {
    const res = await api.get<{ notifications: NotificationItem[] }>('/notifications');
    return res.data.notifications;
  },
  markRead: async (id: string) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.post('/notifications/mark-all-read');
    return res.data;
  }
};

export const auditApi = {
  getAuditLogs: async () => {
    const res = await api.get<{ auditLogs: any[] }>('/audit-logs');
    return res.data.auditLogs;
  }
};

export default api;
