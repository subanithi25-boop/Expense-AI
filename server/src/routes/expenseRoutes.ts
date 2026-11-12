
import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OcrService } from '../services/ocrService';
import { CategorizationService } from '../services/categorizationService';
import { PolicyEngine } from '../services/policyEngine';
import { AnomalyService } from '../services/anomalyService';
import { CurrencyService } from '../services/currencyService';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';

import {
  Expense,
  ExpenseCategory,
  ComplianceStatus,
  PolicyCheckResult,
  AnomalyAssessment
} from '../types';

const router = Router();

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(
      null,
      `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 25 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowedExtensions = [
      '.jpeg',
      '.jpg',
      '.png',
      '.webp',
      '.pdf'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only JPEG, PNG, WebP, and PDF receipt files are supported.'
        )
      );
    }
  }
});

// ==========================================
// HELPER: VALIDATE RECEIPT CALCULATIONS
// ==========================================

const validateReceiptCalculations = (
  extracted: {
    amount: number;
    subtotal?: number;
    taxAmount: number;
    calculationsValid: boolean;
  }
) => {

  const amount = Number(extracted.amount);
  const subtotal = Number(extracted.subtotal);
  const tax = Number(extracted.taxAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      valid: false,
      message: 'Receipt grand total is missing or invalid.'
    };
  }

  if (!extracted.calculationsValid) {
    return {
      valid: false,
      message: 'Receipt calculation discrepancy detected. Manual verification required.'
    };
  }

  if (
    Number.isFinite(subtotal) &&
    subtotal > 0 &&
    Number.isFinite(tax) &&
    tax >= 0
  ) {

    const calculatedTotal = Number(
      (subtotal + tax).toFixed(2)
    );

    const difference = Math.abs(
      calculatedTotal - amount
    );

    if (difference > 0.02) {
      return {
        valid: false,
        message: `Calculated total ${calculatedTotal.toFixed(2)} does not match receipt total ${amount.toFixed(2)}.`
      };
    }
  }

  return {
    valid: true,
    message: 'Receipt calculations verified.'
  };
};

// ==========================================
// 1. SCAN RECEIPT
// ==========================================

router.post(
  '/scan-receipt',
  authenticate,
  upload.single('receipt'),
  async (req: AuthenticatedRequest, res: Response) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          error: 'Receipt image file is required.'
        });
      }

      const buffer = fs.readFileSync(req.file.path);

      const extracted = await OcrService.processReceiptBuffer(
        buffer,
        req.file.originalname
      );

      const receiptUrl = `/uploads/${req.file.filename}`;

      // ======================================
      // DYNAMIC CATEGORY DETECTION
      // ======================================

      const categoryResult = CategorizationService.categorize(
        extracted.merchant,
        '',
        extracted.rawText
      );

      // ======================================
      // DUPLICATE RECEIPT DETECTION
      // ======================================

      const duplicateByHash = db.expenses.find(
        e =>
          e.receiptHash &&
          e.receiptHash === extracted.fileHash
      );

      const duplicateByTx = db.expenses.find(
        e =>
          e.userId === req.user!.id &&
          extracted.merchant.length > 0 &&
          e.merchant.toLowerCase() ===
            extracted.merchant.toLowerCase() &&
          extracted.amount > 0 &&
          Math.abs(e.amount - extracted.amount) < 0.01 &&
          extracted.date.length > 0 &&
          e.date === extracted.date
      );

      const duplicateCheck = {
        isDuplicate: Boolean(
          duplicateByHash || duplicateByTx
        ),

        duplicateType: duplicateByHash
          ? 'file_hash'
          : duplicateByTx
            ? 'transaction'
            : null,

        matchedExpenseId:
          duplicateByHash?.id ||
          duplicateByTx?.id ||
          null,

        message: duplicateByHash
          ? `Duplicate receipt image detected: identical file hash matches prior expense #${duplicateByHash.id.substring(0, 8)}.`

          : duplicateByTx
            ? `Potential duplicate transaction detected: matches prior claim #${duplicateByTx.id.substring(0, 8)}.`

            : 'No duplicate submissions found.'
      };

      // ======================================
      // CALCULATION VALIDATION
      // ======================================

      const calculationResult =
        validateReceiptCalculations(extracted);

      const canEvaluate =
        calculationResult.valid &&
        extracted.merchant.length > 0 &&
        extracted.imageQualityOk;

      // ======================================
      // DEFAULT REVIEW STATUS
      // ======================================

      let complianceStatus: ComplianceStatus = 'needs_review';

      let policyChecks: PolicyCheckResult[] = [];

      let anomalyResult: AnomalyAssessment = {
        riskScore: 0,
        riskLevel: 'Low',
        reasons: [
          'Risk assessment pending receipt verification.'
        ],
        investigationStatus: 'not_flagged'
      };

      // ======================================
      // POLICY AND ANOMALY ASSESSMENT
      // ======================================

      if (canEvaluate) {

        // Evaluate configured corporate policies

        const policyResult = PolicyEngine.evaluateExpense({

          userId: req.user!.id,

          merchant: extracted.merchant,

          amount: extracted.amount,

          category: categoryResult.category,

          date:
            extracted.date ||
            new Date().toISOString().split('T')[0],

          description: `Receipt scanned: ${extracted.merchant}`,

          receiptUrl,

          receiptHash: extracted.fileHash

        });

        complianceStatus = policyResult.status;

        policyChecks = policyResult.checks;

        // Run anomaly detection only after valid extraction

        anomalyResult = AnomalyService.assessExpense({

          userId: req.user!.id,

          merchant: extracted.merchant,

          amount: extracted.amount,

          category: categoryResult.category,

          date: extracted.date,

          receiptHash: extracted.fileHash,

          taxAmount: extracted.taxAmount,

          ocrConfidence: extracted.ocrConfidence

        });

      } else {

        policyChecks = [

          {
            ruleName: 'Receipt Calculation Validation',

            status: 'warning',

            message:
              extracted.calculationNotes ||
              calculationResult.message,

            threshold: 'Verified receipt calculations',

            actual: 'Manual verification required'
          },

          {
            ruleName: 'Receipt OCR Legibility',

            status: 'warning',

            message:
              extracted.qualityWarning ||
              'Receipt requires manual verification.',

            threshold: 'Complete receipt extraction',

            actual: 'Incomplete or unverified'
          }

        ];

      }

      // ======================================
      // RETURN EXTRACTION RESULTS
      // ======================================

      return res.json({

        success: true,

        extracted: {

          merchant: extracted.merchant,

          date: extracted.date,

          amount: extracted.amount,

          subtotal: extracted.subtotal,

          taxAmount: extracted.taxAmount,

          currency: extracted.currency,

          lineItems: extracted.lineItems,

          ocrConfidence: extracted.ocrConfidence,

          receiptUrl,

          receiptHash: extracted.fileHash,

          imageQualityOk: extracted.imageQualityOk,

          qualityWarning: extracted.qualityWarning,

          calculationsValid: calculationResult.valid,

          calculationNotes:
            extracted.calculationNotes ||
            calculationResult.message,

          requiresManualReview: !canEvaluate,

          fieldStatus: extracted.fieldStatus,

          category: categoryResult.category,

          categoryConfidence: categoryResult.confidence,

          categoryReasoning: categoryResult.reasoning,

          duplicateCheck,

          complianceStatus,

          policyChecks,

          anomaly: anomalyResult

        }

      });

    } catch (err: any) {

      console.error('Scan receipt error:', err);

      return res.status(500).json({

        error:
          err.message ||
          'Error processing receipt OCR'

      });

    }

  }
);

// ==========================================
// 2. GET EXPENSES
// ==========================================

router.get(
  '/',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {

    const user = req.user!;

    let list = db.expenses;

    // Role isolation

    if (user.role === 'employee') {

      list = list.filter(
        e => e.userId === user.id
      );

    } else if (user.role === 'manager') {

      list = list.filter(
        e =>
          e.userDepartment === user.department ||
          e.userId === user.id
      );

    }

    // Filtering

    const {
      category,
      status,
      search,
      compliance
    } = req.query;

    if (category && category !== 'All') {

      list = list.filter(
        e => e.category === category
      );

    }

    if (status && status !== 'All') {

      list = list.filter(
        e => e.status === status
      );

    }

    if (compliance && compliance !== 'All') {

      list = list.filter(
        e => e.complianceStatus === compliance
      );

    }

    if (search) {

      const q = String(search).toLowerCase();

      list = list.filter(
        e =>
          e.merchant.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.userName.toLowerCase().includes(q)
      );

    }

    list = list.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

    return res.json({
      expenses: list
    });

  }
);

// ==========================================
// 3. CREATE EXPENSE
// ==========================================

router.post(
  '/',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {

    const user = req.user!;

    const {

      merchant,

      date,

      amount,

      currency = 'USD',

      taxAmount,

      subtotal,

      calculationsValid,

      lineItems,

      ocrConfidence,

      category,

      description = '',

      receiptUrl,

      receiptHash,

      splits,

      paymentMethod = 'Personal Card',

      isMileage = false,

      mileageDetails

    } = req.body;

    // Required fields

    if (
      !merchant ||
      amount === undefined ||
      !date ||
      !category
    ) {

      return res.status(400).json({

        error:
          'Merchant, amount, date, and category are required.'

      });

    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {

      return res.status(400).json({

        error: 'Please provide a valid expense amount.'

      });

    }

    // Prevent explicitly unverified OCR data
    // Manual entries without this property remain supported.

    if (
      calculationsValid === false
    ) {

      return res.status(400).json({

        error:
          'Receipt calculation is incorrect. Please verify the receipt before submitting.',

        requiresManualReview: true

      });

    }

    if (
      subtotal !== undefined &&
      taxAmount !== undefined
    ) {

      const numericSubtotal = Number(subtotal);

      const numericTax = Number(taxAmount);

      if (
        !Number.isFinite(numericSubtotal) ||
        !Number.isFinite(numericTax) ||
        numericSubtotal < 0 ||
        numericTax < 0
      ) {

        return res.status(400).json({

          error: 'Invalid subtotal or tax amount.'

        });

      }

      const calculatedTotal = Number(
        (numericSubtotal + numericTax).toFixed(2)
      );

      if (
        Math.abs(calculatedTotal - numericAmount) > 0.02
      ) {

        return res.status(400).json({

          error:
            `Calculation mismatch. Subtotal plus tax is ${calculatedTotal.toFixed(2)}, but the submitted total is ${numericAmount.toFixed(2)}.`,

          requiresManualReview: true

        });

      }

    }

    // ======================================
    // CURRENCY CONVERSION
    // ======================================

    const {
      convertedAmount,
      rate
    } = CurrencyService.convertToUSD(
      numericAmount,
      currency
    );

    // ======================================
    // CORPORATE POLICY EVALUATION
    // ======================================

    const policyResult = PolicyEngine.evaluateExpense({

      userId: user.id,

      merchant,

      amount: convertedAmount,

      category,

      date,

      description,

      receiptUrl,

      receiptHash

    });

    // ======================================
    // ANOMALY DETECTION
    // ======================================

    const anomalyResult = AnomalyService.assessExpense({

      userId: user.id,

      merchant,

      amount: convertedAmount,

      category,

      date,

      receiptHash

    });

    // ======================================
    // CATEGORY CLASSIFICATION
    // ======================================

    const categoryResult =
      CategorizationService.categorize(
        merchant,
        description
      );

    // ======================================
    // CREATE EXPENSE
    // ======================================

    const newExpense: Expense = {

      id: uuidv4(),

      userId: user.id,

      userName: user.name,

      userDepartment: user.department,

      merchant,

      date,

      amount: numericAmount,

      currency,

      exchangeRate: rate,

      convertedAmount,

      taxAmount:
        taxAmount !== undefined
          ? Number(taxAmount)
          : undefined,

      lineItems:
        Array.isArray(lineItems)
          ? lineItems
          : undefined,

      ocrConfidence:
        ocrConfidence !== undefined
          ? Number(ocrConfidence)
          : undefined,

      category: category as ExpenseCategory,

      categoryReasoning: categoryResult.reasoning,

      description,

      receiptUrl,

      receiptHash,

      complianceStatus: policyResult.status,

      policyChecks: policyResult.checks,

      anomaly: anomalyResult,

      status: 'pending',

      splits: splits || [],

      paymentMethod,

      isMileage,

      mileageDetails,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()

    };

    const list = db.expenses;

    list.unshift(newExpense);

    db.expenses = list;

    // ======================================
    // AUDIT LOG
    // ======================================

    AuditService.log({

      actorId: user.id,

      actorName: user.name,

      actorRole: user.role,

      action: 'EXPENSE_SUBMITTED',

      entityType: 'expense',

      entityId: newExpense.id,

      details:
        `Submitted expense for ${merchant} (${currency} ${numericAmount.toFixed(2)}) - Policy: ${policyResult.status}`

    });

    // ======================================
    // MANAGER NOTIFICATIONS
    // ======================================

    if (
      anomalyResult.riskLevel === 'High' ||
      policyResult.status === 'violation'
    ) {

      NotificationService.broadcastToRole(
        'manager',
        {

          title: 'Expense Review Alert',

          message:
            `${user.name} submitted an expense with ${
              policyResult.status === 'violation'
                ? 'policy violation'
                : 'high anomaly risk'
            }: ${merchant} (${currency} ${numericAmount.toFixed(2)})`,

          type: 'anomaly',

          link:
            `/dashboard/approvals?expenseId=${newExpense.id}`

        }
      );

    }

    return res.status(201).json({

      expense: newExpense

    });

  }
);

// ==========================================
// 4. UPDATE EXPENSE
// ==========================================

router.put(
  '/:id',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {

    const { id } = req.params;

    const user = req.user!;

    const list = db.expenses;

    const index = list.findIndex(
      e => e.id === id
    );

    if (index === -1) {

      return res.status(404).json({

        error: 'Expense not found'

      });

    }

    const existing = list[index];

    // Permission check

    if (
      user.role === 'employee' &&
      existing.userId !== user.id
    ) {

      return res.status(403).json({

        error: 'Unauthorized to edit this expense'

      });

    }

    const updated = {

      ...existing,

      ...req.body,

      updatedAt: new Date().toISOString()

    };

    // Validate updated financial values

    if (req.body.amount !== undefined) {

      const newAmount = Number(req.body.amount);

      if (
        !Number.isFinite(newAmount) ||
        newAmount <= 0
      ) {

        return res.status(400).json({

          error: 'Invalid expense amount.'

        });

      }

    }

    // Re-run policy and anomaly checks

    if (
      req.body.amount !== undefined ||
      req.body.category !== undefined ||
      req.body.merchant !== undefined
    ) {

      const convertedAmount =
        updated.convertedAmount ||
        updated.amount;

      const policy = PolicyEngine.evaluateExpense({

        userId: updated.userId,

        merchant: updated.merchant,

        amount: convertedAmount,

        category: updated.category,

        date: updated.date,

        description: updated.description,

        receiptUrl: updated.receiptUrl,

        receiptHash: updated.receiptHash

      }, existing.id);

      updated.complianceStatus = policy.status;

      updated.policyChecks = policy.checks;

      updated.anomaly = AnomalyService.assessExpense({

        userId: updated.userId,

        merchant: updated.merchant,

        amount: convertedAmount,

        category: updated.category,

        date: updated.date,

        receiptHash: updated.receiptHash,

        taxAmount: updated.taxAmount,

        ocrConfidence: updated.ocrConfidence

      });

    }

    list[index] = updated;

    db.expenses = list;

    AuditService.log({

      actorId: user.id,

      actorName: user.name,

      actorRole: user.role,

      action: 'EXPENSE_UPDATED',

      entityType: 'expense',

      entityId: updated.id,

      details:
        `Updated expense #${id.substring(0, 8)} (${updated.merchant})`

    });

    return res.json({

      expense: updated

    });

  }
);

// ==========================================
// 5. DELETE EXPENSE
// ==========================================

router.delete(
  '/:id',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {

    const { id } = req.params;

    const user = req.user!;

    const list = db.expenses;

    const item = list.find(
      e => e.id === id
    );

    if (!item) {

      return res.status(404).json({

        error: 'Expense not found'

      });

    }

    if (
      user.role === 'employee' &&
      item.userId !== user.id
    ) {

      return res.status(403).json({

        error: 'Unauthorized to delete this expense'

      });

    }

    db.expenses = list.filter(
      e => e.id !== id
    );

    AuditService.log({

      actorId: user.id,

      actorName: user.name,

      actorRole: user.role,

      action: 'EXPENSE_DELETED',

      entityType: 'expense',

      entityId: id,

      details:
        `Deleted expense for ${item.merchant} (${item.currency} ${item.amount})`

    });

    return res.json({

      success: true,

      message: 'Expense deleted successfully'

    });

  }
);

// ==========================================
// 6. RESOLVE ANOMALY INVESTIGATION
// ==========================================

router.post(
  '/:id/resolve-anomaly',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {

    const { id } = req.params;

    const user = req.user!;

    const {
      resolution,
      reviewerNotes
    } = req.body;

    if (user.role === 'employee') {

      return res.status(403).json({

        error:
          'Only Managers and Finance personnel can resolve anomalies'

      });

    }

    if (
      !['legitimate', 'rejected'].includes(resolution)
    ) {

      return res.status(400).json({

        error:
          'Resolution must be legitimate or rejected.'

      });

    }

    const list = db.expenses;

    const index = list.findIndex(
      e => e.id === id
    );

    if (index === -1) {

      return res.status(404).json({

        error: 'Expense not found'

      });

    }

    const expense = list[index];

    expense.anomaly.investigationStatus =
      resolution === 'legitimate'
        ? 'resolved_legitimate'
        : 'resolved_rejected';

    expense.anomaly.reviewerNotes = reviewerNotes;

    if (resolution === 'legitimate') {

      expense.anomaly.riskLevel = 'Low';

      expense.anomaly.riskScore = Math.min(
        25,
        expense.anomaly.riskScore
      );

    }

    list[index] = expense;

    db.expenses = list;

    AuditService.log({

      actorId: user.id,

      actorName: user.name,

      actorRole: user.role,

      action: 'ANOMALY_RESOLVED',

      entityType: 'expense',

      entityId: id,

      details:
        `Anomaly marked as "${resolution}" by ${user.name}: ${reviewerNotes || 'No notes'}`

    });

    return res.json({

      success: true,

      expense

    });

  }
);

export default router;
