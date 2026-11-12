import { AnomalyAssessment, Expense } from '../types';
import { db } from '../db';

export class AnomalyService {
  public static assessExpense(
    expense: {
      userId: string;
      merchant: string;
      amount: number;
      category: string;
      date: string;
      receiptHash?: string;
      taxAmount?: number;
      ocrConfidence?: number;
    },
    existingExpenseId?: string
  ): AnomalyAssessment {
    let riskScore = 8; // baseline low risk
    const reasons: string[] = [];

    const otherExpenses = db.expenses.filter(e => e.id !== existingExpenseId);

    // 1. Check for Duplicate Receipt Hash (High Risk signal)
    if (expense.receiptHash) {
      const hashMatch = otherExpenses.find(e => e.receiptHash && e.receiptHash === expense.receiptHash);
      if (hashMatch) {
        riskScore += 65;
        reasons.push(`Duplicate receipt image detected: Exact cryptographic hash matches prior claim #${hashMatch.id.substring(0, 8)}.`);
      }
    }

    // 2. Check for Multiple Transactions at same merchant on same day
    const sameDayMerchantCount = otherExpenses.filter(
      e => e.userId === expense.userId &&
           e.merchant.toLowerCase() === expense.merchant.toLowerCase() &&
           e.date === expense.date
    ).length;

    if (sameDayMerchantCount >= 2) {
      riskScore += 30;
      reasons.push(`High frequency: ${sameDayMerchantCount + 1} distinct transactions submitted for "${expense.merchant}" on the same date.`);
    }

    // 3. Category statistical outlier check
    const categoryExpenses = otherExpenses.filter(e => e.category === expense.category && e.amount > 0);
    if (categoryExpenses.length >= 3) {
      const avg = categoryExpenses.reduce((sum, e) => sum + e.amount, 0) / categoryExpenses.length;
      if (expense.amount > avg * 3.0) {
        riskScore += 25;
        reasons.push(`Statistical anomaly: Amount ($${expense.amount.toFixed(2)}) is over 3x the department average for ${expense.category} ($${avg.toFixed(2)}).`);
      } else if (expense.amount > avg * 2.0) {
        riskScore += 15;
        reasons.push(`Elevated spend: Amount ($${expense.amount.toFixed(2)}) exceeds 2x category benchmark ($${avg.toFixed(2)}).`);
      }
    }

    // 4. Round Number Detection (e.g., exactly $500.00, $1,000.00)
    if (expense.amount >= 200 && expense.amount % 50 === 0) {
      riskScore += 12;
      reasons.push(`Round number alert: Exact multiple of $50 ($${expense.amount.toFixed(2)}) without cent breakdown. Verify itemized receipt.`);
    }

    // 5. Weekend / Holiday Business Spend
    const parsedDate = new Date(expense.date);
    const dayOfWeek = parsedDate.getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (expense.category === 'Office Supplies' || expense.category === 'Training & Education') {
        riskScore += 10;
        reasons.push(`Weekend transaction flagged: Routine office/equipment expense dated on a weekend (${expense.date}).`);
      }
    }

    // 6. OCR confidence mismatch or low confidence
    if (expense.ocrConfidence !== undefined && expense.ocrConfidence < 60) {
      riskScore += 15;
      reasons.push(`Low OCR text extraction confidence (${expense.ocrConfidence}%). Image details may be partially obscured.`);
    }

    // Cap risk score between 0 and 100
    riskScore = Math.min(100, Math.max(5, riskScore));

    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (riskScore >= 70) {
      riskLevel = 'High';
    } else if (riskScore >= 35) {
      riskLevel = 'Medium';
    }

    if (reasons.length === 0) {
      reasons.push('Standard expenditure pattern within established historical norms.');
    }

    return {
      riskScore,
      riskLevel,
      reasons,
      investigationStatus: riskScore >= 70 ? 'flagged' : 'not_flagged'
    };
  }
}
