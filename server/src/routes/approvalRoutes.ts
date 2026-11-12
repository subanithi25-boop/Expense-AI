import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';

const router = Router();

// Get items awaiting approval
router.get('/pending', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (user.role === 'employee') {
    return res.status(403).json({ error: 'Access restricted to Managers, Finance, and Administrators' });
  }

  // Pending individual expenses
  let pendingExpenses = db.expenses.filter(e => e.status === 'pending');
  // Pending reports
  let pendingReports = db.reports.filter(r => r.status === 'submitted' || r.status === 'under_review');

  if (user.role === 'manager') {
    pendingExpenses = pendingExpenses.filter(e => e.userDepartment === user.department);
    pendingReports = pendingReports.filter(r => r.userDepartment === user.department);
  }

  res.json({
    pendingExpenses,
    pendingReports,
    counts: {
      expenses: pendingExpenses.length,
      reports: pendingReports.length,
      highRiskCount: pendingExpenses.filter(e => e.anomaly.riskLevel === 'High').length,
      violationsCount: pendingExpenses.filter(e => e.complianceStatus === 'violation').length
    }
  });
});

// Single expense decision (Approve / Reject / Request Changes / Policy Override)
router.post('/expenses/:id/decide', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { decision, comments, overridePolicyReason } = req.body; // 'approve' | 'reject' | 'changes_requested'

  if (user.role === 'employee') {
    return res.status(403).json({ error: 'Unauthorized to approve expenses' });
  }

  const list = db.expenses;
  const index = list.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const expense = list[index];

  if (decision === 'approve') {
    expense.status = 'approved';
    if (overridePolicyReason) {
      AuditService.log({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: 'POLICY_EXCEPTION_OVERRIDDEN',
        entityType: 'expense',
        entityId: expense.id,
        details: `Manager approved expense despite policy flags. Justification: "${overridePolicyReason}"`
      });
    }
  } else if (decision === 'reject') {
    expense.status = 'rejected';
    expense.rejectionReason = comments;
  } else if (decision === 'changes_requested') {
    expense.status = 'draft';
    expense.rejectionReason = comments;
  }

  list[index] = expense;
  db.expenses = list;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: `EXPENSE_${decision.toUpperCase()}`,
    entityType: 'expense',
    entityId: expense.id,
    details: `${user.name} decided ${decision.toUpperCase()} on ${expense.merchant} ($${expense.amount}): ${comments || 'No comment'}`
  });

  NotificationService.send({
    userId: expense.userId,
    title: `Expense ${decision.replace('_', ' ').toUpperCase()}: ${expense.merchant}`,
    message: `${user.name} marked your expense as ${decision}. ${comments ? `Note: ${comments}` : ''}`,
    type: 'approval',
    link: `/dashboard/expenses?id=${expense.id}`
  });

  res.json({ success: true, expense });
});

// Batch approval
router.post('/batch-approve', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { expenseIds = [], comments = 'Batch approval' } = req.body;

  if (user.role === 'employee') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const list = db.expenses;
  let count = 0;

  for (const exp of list) {
    if (expenseIds.includes(exp.id) && exp.status === 'pending') {
      exp.status = 'approved';
      count++;
      NotificationService.send({
        userId: exp.userId,
        title: `Expense Approved: ${exp.merchant}`,
        message: `Your expense for $${exp.amount} was approved by ${user.name}.`,
        type: 'approval',
        link: `/dashboard/expenses?id=${exp.id}`
      });
    }
  }

  db.expenses = list;

  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'BATCH_EXPENSES_APPROVED',
    entityType: 'expense',
    entityId: 'multiple',
    details: `Batch approved ${count} expenses by ${user.name}`
  });

  res.json({ success: true, approvedCount: count });
});

export default router;
