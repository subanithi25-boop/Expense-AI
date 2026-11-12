import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';
import { ExpenseReport, ReportStatus } from '../types';

const router = Router();

// List expense reports
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let reports = db.reports;

  if (user.role === 'employee') {
    reports = reports.filter(r => r.userId === user.id);
  } else if (user.role === 'manager') {
    reports = reports.filter(r => r.userDepartment === user.department || r.userId === user.id);
  }

  // Sort newest first
  reports = reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ reports });
});

// Get single report with all attached expenses
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const report = db.reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const expenses = db.expenses.filter(e => (report.expenseIds || []).includes(e.id));

  res.json({ report, expenses });
});

// Create new report
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, startDate, endDate, expenseIds = [] } = req.body;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'Title, start date, and end date are required' });
  }

  // Calculate totals and compliance summary from selected expenses
  const selectedExpenses = db.expenses.filter(e => expenseIds.includes(e.id));
  const totalAmount = selectedExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

  const compliantCount = selectedExpenses.filter(e => e.complianceStatus === 'compliant').length;
  const warningCount = selectedExpenses.filter(e => e.complianceStatus === 'warning').length;
  const violationCount = selectedExpenses.filter(e => e.complianceStatus === 'violation').length;

  const count = db.reports.length + 1;
  const reportNumber = `EXP-2026-${String(count).padStart(4, '0')}`;

  const newReport: ExpenseReport = {
    id: uuidv4(),
    reportNumber,
    title,
    userId: user.id,
    userName: user.name,
    userDepartment: user.department,
    startDate,
    endDate,
    expenseIds,
    totalAmount,
    currency: 'USD',
    status: 'draft',
    complianceSummary: {
      compliantCount,
      warningCount,
      violationCount
    },
    createdAt: new Date().toISOString()
  };

  const reports = db.reports;
  reports.unshift(newReport);
  db.reports = reports;

  // Mark expenses with reportId
  const allExpenses = db.expenses;
  for (const exp of allExpenses) {
    if (expenseIds.includes(exp.id)) {
      exp.reportId = newReport.id;
    }
  }
  db.expenses = allExpenses;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REPORT_CREATED',
    entityType: 'report',
    entityId: newReport.id,
    details: `Created expense report ${reportNumber} with ${expenseIds.length} transactions (${totalAmount.toFixed(2)})`
  });

  res.status(201).json({ report: newReport });
});

// Submit report for manager review
router.post('/:id/submit', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const reports = db.reports;
  const index = reports.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const report = reports[index];
  if (user.role === 'employee' && report.userId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  report.status = 'submitted';
  report.submittedAt = new Date().toISOString();
  reports[index] = report;
  db.reports = reports;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'REPORT_SUBMITTED',
    entityType: 'report',
    entityId: report.id,
    details: `Submitted report ${report.reportNumber} for departmental approval`
  });

  NotificationService.broadcastToRole('manager', {
    title: 'New Expense Report for Review',
    message: `${user.name} submitted expense report ${report.reportNumber} ($${report.totalAmount.toFixed(2)})`,
    type: 'approval',
    link: `/dashboard/approvals?reportId=${report.id}`
  });

  res.json({ report });
});

// Update report status (e.g. approved, changes requested, reimbursed)
router.post('/:id/transition', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { status, reviewerNotes } = req.body as { status: ReportStatus; reviewerNotes?: string };

  const reports = db.reports;
  const index = reports.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const report = reports[index];

  if (user.role === 'employee') {
    return res.status(403).json({ error: 'Employees cannot change approval statuses.' });
  }

  report.status = status;
  if (reviewerNotes) report.reviewerNotes = reviewerNotes;

  if (status === 'approved') {
    report.approvedAt = new Date().toISOString();
    // Update attached expenses to approved
    const expenses = db.expenses;
    for (const exp of expenses) {
      if (report.expenseIds.includes(exp.id)) {
        exp.status = 'approved';
      }
    }
    db.expenses = expenses;
  } else if (status === 'reimbursed') {
    report.reimbursedAt = new Date().toISOString();
    // Update attached expenses to reimbursed
    const expenses = db.expenses;
    for (const exp of expenses) {
      if (report.expenseIds.includes(exp.id)) {
        exp.status = 'reimbursed';
      }
    }
    db.expenses = expenses;
  }

  reports[index] = report;
  db.reports = reports;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: `REPORT_STATUS_${status.toUpperCase()}`,
    entityType: 'report',
    entityId: report.id,
    details: `Report ${report.reportNumber} moved to status ${status}: ${reviewerNotes || 'No notes'}`
  });

  NotificationService.send({
    userId: report.userId,
    title: `Report Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
    message: `Your report ${report.reportNumber} status is now "${status}". ${reviewerNotes ? `Notes: ${reviewerNotes}` : ''}`,
    type: status === 'reimbursed' ? 'reimbursement' : 'approval',
    link: `/dashboard/reports/${report.id}`
  });

  res.json({ report });
});

export default router;
