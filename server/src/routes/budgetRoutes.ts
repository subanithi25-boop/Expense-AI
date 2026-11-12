import { Router, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { DepartmentBudget } from '../types';

const router = Router();

// Get budgets with live spent amounts and forecasts
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let budgets = db.budgets;

  // Filter if user is employee or manager
  if (user.role === 'employee' || user.role === 'manager') {
    // Show user's department budget first
  }

  // Calculate live spent and pending amounts from real expenses
  const enhancedBudgets = budgets.map(b => {
    const deptExpenses = db.expenses.filter(e => e.userDepartment.toLowerCase() === b.department.toLowerCase());
    const spent = deptExpenses
      .filter(e => e.status === 'approved' || e.status === 'reimbursed')
      .reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);
    const pending = deptExpenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

    const totalUsed = spent + pending;
    const remaining = Math.max(0, b.monthlyAllocation - spent);
    const utilizationRate = Math.min(100, Math.round((spent / b.monthlyAllocation) * 100));

    // Forecast: Current day of month ratio
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const runRate = spent / Math.max(1, dayOfMonth);
    const projectedMonthEnd = Math.round(runRate * daysInMonth);

    // Compute category spent within department
    const categorySpent: Record<string, number> = {};
    for (const exp of deptExpenses) {
      if (exp.status === 'approved' || exp.status === 'reimbursed' || exp.status === 'pending') {
        categorySpent[exp.category] = (categorySpent[exp.category] || 0) + (exp.convertedAmount || exp.amount);
      }
    }

    return {
      ...b,
      spentAmount: spent,
      pendingAmount: pending,
      remainingAmount: remaining,
      utilizationRate,
      projectedMonthEnd,
      isNearLimit: utilizationRate >= 80,
      isOverBudget: spent > b.monthlyAllocation,
      categorySpent
    };
  });

  res.json({ budgets: enhancedBudgets });
});

// Update department budget allocation (Admin / Finance)
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { monthlyAllocation, allocatedCategories } = req.body;

  if (user.role !== 'admin' && user.role !== 'finance') {
    return res.status(403).json({ error: 'Only Finance and Administrators can adjust budget allocations' });
  }

  const list = db.budgets;
  const index = list.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  list[index].monthlyAllocation = Number(monthlyAllocation);
  if (allocatedCategories) {
    list[index].allocatedCategories = allocatedCategories;
  }
  db.budgets = list;

  res.json({ budget: list[index] });
});

export default router;
