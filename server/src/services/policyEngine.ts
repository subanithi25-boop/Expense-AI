import { Expense, PolicyCheckResult, ComplianceStatus, CorporatePolicy } from '../types';
import { db } from '../db';

const DEFAULT_POLICIES: CorporatePolicy[] = [
  {
    id: 'pol-01',
    name: 'Mandatory Receipt Requirement',
    category: 'All',
    requireReceiptAboveAmount: 25.0,
    isRestrictedCategory: false,
    active: true,
    description: 'Verified tax invoice or receipt required for all single transactions above $25.00.'
  },
  {
    id: 'pol-02',
    name: 'Daily Meal Allowance Cap',
    category: 'Meals & Entertainment',
    maxDailyAmount: 75.0,
    requireReceiptAboveAmount: 15.0,
    isRestrictedCategory: false,
    active: true,
    description: 'Maximum permitted per-employee meal expenditure is $75.00/day unless multi-person client entertainment.'
  },
  {
    id: 'pol-03',
    name: 'Commercial Flight Class Restriction',
    category: 'Travel',
    allowedFlightClasses: ['Economy', 'Standard'],
    requireReceiptAboveAmount: 0.0,
    isRestrictedCategory: false,
    active: true,
    description: 'Domestic & short-haul flights must be booked in Economy. Premium/First Class requires VP pre-clearance.'
  },
  {
    id: 'pol-04',
    name: 'Executive Single Transaction Review Limit',
    category: 'All',
    maxSingleAmount: 2500.0,
    requireReceiptAboveAmount: 0.0,
    isRestrictedCategory: false,
    active: true,
    description: 'Single transactions over $2,500 require secondary Finance review; >$5,000 strictly prohibited without prior purchase order.'
  },
  {
    id: 'pol-05',
    name: 'Restricted Entertainment & Gaming Vendors',
    category: 'Other',
    requireReceiptAboveAmount: 0.0,
    isRestrictedCategory: true,
    active: true,
    description: 'Gaming, casinos, alcohol-only establishments, and non-business retail are non-reimbursable.'
  }
];

export class PolicyEngine {
  public static evaluateExpense(
    expense: {
      userId: string;
      merchant: string;
      amount: number;
      category: string;
      date: string;
      description: string;
      receiptUrl?: string;
      receiptHash?: string;
    },
    existingExpenseId?: string,
    customPolicies?: CorporatePolicy[]
  ): { status: ComplianceStatus; checks: PolicyCheckResult[] } {
    const checks: PolicyCheckResult[] = [];

    // Resolve policies: customPolicies -> db.policies -> DEFAULT_POLICIES
    const activePoliciesList: CorporatePolicy[] =
      (customPolicies && customPolicies.length > 0)
        ? customPolicies
        : (Array.isArray(db.policies) && db.policies.length > 0)
          ? db.policies
          : DEFAULT_POLICIES;

    // Helper to find policy by ID or fallback
    const findPolicy = (id: string, defaultFallbackId: string): CorporatePolicy => {
      const found = activePoliciesList.find(p => p.id === id);
      if (found) return found;
      return DEFAULT_POLICIES.find(p => p.id === defaultFallbackId)!;
    };

    // Rule 1: Receipt Requirement (pol-01)
    const receiptPolicy = findPolicy('pol-01', 'pol-01');
    if (receiptPolicy.active !== false) {
      let threshold = Number(receiptPolicy.requireReceiptAboveAmount);
      if (!Number.isFinite(threshold) || threshold < 0) {
        checks.push({
          ruleName: 'Mandatory Receipt Requirement Configuration Error',
          status: 'warning',
          message: `Invalid receipt threshold configured (${receiptPolicy.requireReceiptAboveAmount}). Enforcing safe standard limit ($25.00) to protect compliance.`,
          threshold: '$25.00 (Safe Default)',
          actual: `Invalid configuration: "${receiptPolicy.requireReceiptAboveAmount}"`
        });
        threshold = 25.0;
      }

      if (expense.amount > threshold && (!expense.receiptUrl || expense.receiptUrl.trim() === '')) {
        checks.push({
          ruleName: 'Mandatory Receipt Requirement',
          status: 'violation',
          message: `Company policy requires a verified receipt for all expenditures exceeding $${threshold.toFixed(2)}.`,
          threshold: `$${threshold.toFixed(2)}`,
          actual: `$${expense.amount.toFixed(2)} (No receipt attached)`
        });
      } else {
        checks.push({
          ruleName: 'Mandatory Receipt Requirement',
          status: 'passed',
          message: 'Receipt documentation requirement satisfied.',
          threshold: `$${threshold.toFixed(2)}`,
          actual: expense.receiptUrl ? 'Verified Receipt Attached' : `$${expense.amount.toFixed(2)} (< $${threshold.toFixed(0)})`
        });
      }
    }

    // Rule 2: Maximum Daily Meal Allowance (pol-02)
    if (expense.category === 'Meals & Entertainment') {
      const mealPolicy = findPolicy('pol-02', 'pol-02');
      if (mealPolicy.active !== false) {
        let mealLimit = Number(mealPolicy.maxDailyAmount);
        if (!Number.isFinite(mealLimit) || mealLimit <= 0) {
          checks.push({
            ruleName: 'Daily Meal Allowance Configuration Error',
            status: 'warning',
            message: `Invalid meal allowance cap configured (${mealPolicy.maxDailyAmount}). Enforcing safe standard guideline ($75.00/day).`,
            threshold: '$75.00/day (Safe Default)',
            actual: `Invalid configuration: "${mealPolicy.maxDailyAmount}"`
          });
          mealLimit = 75.0;
        }

        if (expense.amount > mealLimit) {
          checks.push({
            ruleName: 'Daily Meal Allowance Cap',
            status: 'warning',
            message: `Single meal expenditure of $${expense.amount.toFixed(2)} exceeds the standard $${mealLimit.toFixed(2)} per-person guideline. Manager justification required.`,
            threshold: `$${mealLimit.toFixed(2)}/day`,
            actual: `$${expense.amount.toFixed(2)}`
          });
        } else {
          checks.push({
            ruleName: 'Daily Meal Allowance Cap',
            status: 'passed',
            message: 'Meal expense is within standard daily allowance limits.',
            threshold: `$${mealLimit.toFixed(2)}/day`,
            actual: `$${expense.amount.toFixed(2)}`
          });
        }
      }
    }

    // Rule 3: Flight Class Restriction (pol-03)
    if (expense.category === 'Travel') {
      const flightPolicy = findPolicy('pol-03', 'pol-03');
      if (flightPolicy.active !== false) {
        const allowed = Array.isArray(flightPolicy.allowedFlightClasses) && flightPolicy.allowedFlightClasses.length > 0
          ? flightPolicy.allowedFlightClasses
          : ['Economy', 'Standard'];
        const descLower = (expense.description + ' ' + expense.merchant).toLowerCase();
        const containsFirst = descLower.includes('first class');
        const containsBusiness = descLower.includes('business class');
        const allowsBusiness = allowed.some(c => c.toLowerCase().includes('business'));
        const allowsFirst = allowed.some(c => c.toLowerCase().includes('first'));

        const isRestricted = (containsFirst && !allowsFirst) || (containsBusiness && !allowsBusiness);
        if (isRestricted) {
          checks.push({
            ruleName: 'Flight Class Policy',
            status: 'violation',
            message: 'Corporate travel policy permits Economy/Standard class only. Premium/First Class bookings require VP pre-authorization.',
            threshold: allowed.join(' / ') || 'Economy Class',
            actual: 'First / Business Class detected'
          });
        } else {
          checks.push({
            ruleName: 'Flight Class Policy',
            status: 'passed',
            message: 'Booking aligns with standard travel tier guidelines.',
            threshold: allowed.join(' / ') || 'Economy Class',
            actual: 'Standard / Economy'
          });
        }
      }
    }

    // Rule 4: Single Transaction Spending Limit ($2,500 threshold & $5,000 cap) (pol-04)
    const txPolicy = findPolicy('pol-04', 'pol-04');
    if (txPolicy.active !== false) {
      let singleTxLimit = Number(txPolicy.maxSingleAmount);
      const MAX_ALLOWED_TX = 5000.0;
      if (!Number.isFinite(singleTxLimit) || singleTxLimit <= 0) {
        checks.push({
          ruleName: 'Transaction Spending Limits Configuration Error',
          status: 'warning',
          message: `Invalid single transaction threshold configured (${txPolicy.maxSingleAmount}). Enforcing safe standard limit ($2,500.00).`,
          threshold: '$2500.00 (Safe Default)',
          actual: `Invalid configuration: "${txPolicy.maxSingleAmount}"`
        });
        singleTxLimit = 2500.0;
      }

      if (expense.amount > MAX_ALLOWED_TX) {
        checks.push({
          ruleName: 'Maximum Single Transaction Cap',
          status: 'violation',
          message: `Expense of $${expense.amount.toFixed(2)} exceeds maximum unapproved single-item limit ($${MAX_ALLOWED_TX}.00). Formal procurement review required.`,
          threshold: `$${MAX_ALLOWED_TX}.00`,
          actual: `$${expense.amount.toFixed(2)}`
        });
      } else if (expense.amount > singleTxLimit) {
        checks.push({
          ruleName: 'High-Value Transaction Review',
          status: 'warning',
          message: `Transaction exceeds $${singleTxLimit}.00 tier. Requires secondary Finance approval.`,
          threshold: `$${singleTxLimit}.00`,
          actual: `$${expense.amount.toFixed(2)}`
        });
      } else {
        checks.push({
          ruleName: 'Transaction Spending Limits',
          status: 'passed',
          message: 'Expense is within individual transaction thresholds.',
          threshold: `$${singleTxLimit}.00`,
          actual: `$${expense.amount.toFixed(2)}`
        });
      }
    }

    // Rule 5: Duplicate Receipt & Transaction Check
    const allExpenses = db.expenses.filter(e => e.id !== existingExpenseId);
    let duplicateFound = false;

    for (const prev of allExpenses) {
      // Check identical receipt file hash
      if (expense.receiptHash && prev.receiptHash && expense.receiptHash === prev.receiptHash) {
        checks.push({
          ruleName: 'Duplicate Receipt Prevention',
          status: 'violation',
          message: `Identical receipt file hash matched previously filed expense #${prev.id.substring(0, 8)} (${prev.merchant} - $${prev.amount}).`,
          threshold: 'Unique receipt image',
          actual: 'Duplicate receipt hash detected'
        });
        duplicateFound = true;
        break;
      }

      // Check identical merchant, amount, and exact date
      if (
        prev.userId === expense.userId &&
        prev.merchant.toLowerCase() === expense.merchant.toLowerCase() &&
        Math.abs(prev.amount - expense.amount) < 0.01 &&
        prev.date === expense.date
      ) {
        checks.push({
          ruleName: 'Duplicate Transaction Detection',
          status: 'warning',
          message: `Identical transaction recorded for ${prev.merchant} on ${prev.date} ($${prev.amount.toFixed(2)}).`,
          threshold: 'No duplicate merchant + date + amount',
          actual: 'Potential duplicate submission'
        });
        duplicateFound = true;
        break;
      }
    }

    if (!duplicateFound) {
      checks.push({
        ruleName: 'Duplicate Detection',
        status: 'passed',
        message: 'No duplicate receipts or matching transactions found.',
        threshold: 'Unique submissions',
        actual: 'Unique'
      });
    }

    // Rule 6: Restricted Category Check (pol-05)
    const vendorPolicy = findPolicy('pol-05', 'pol-05');
    if (vendorPolicy.active !== false) {
      const desc = (expense.description + ' ' + expense.merchant).toLowerCase();
      if (desc.includes('casino') || desc.includes('liquor store') || desc.includes('lottery') || desc.includes('fine/penalty')) {
        checks.push({
          ruleName: 'Restricted Category Policy',
          status: 'violation',
          message: 'Corporate expenditure policy strictly prohibits personal entertainment, gaming, or non-reimbursable vices.',
          threshold: 'Permitted business vendors',
          actual: 'Restricted vendor/keyword detected'
        });
      }
    }

    // Determine aggregate compliance status
    const hasViolation = checks.some(c => c.status === 'violation');
    const hasWarning = checks.some(c => c.status === 'warning');

    let overallStatus: ComplianceStatus = 'compliant';
    if (hasViolation) {
      overallStatus = 'violation';
    } else if (hasWarning) {
      overallStatus = 'warning';
    }

    return { status: overallStatus, checks };
  }
}

