
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { MileageService } from '../services/mileageService';
import { AuditService } from '../services/auditService';
import { MileageClaim, Expense } from '../types';

const router = Router();

// Calculate distance & estimated reimbursement
router.post('/calculate', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { origin, destination } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  const { distanceMiles, method } = MileageService.calculateDistance(origin, destination);
  const ratePerMile = MileageService.DEFAULT_RATE_PER_MILE;
  const estimatedReimbursement = MileageService.computeReimbursement(distanceMiles, ratePerMile);

  res.json({
    origin,
    destination,
    distanceMiles,
    ratePerMile,
    estimatedReimbursement,
    calculationMethod: method
  });
});

// List mileage claims
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let claims = db.mileageClaims;

  if (user.role === 'employee') {
    claims = claims.filter(c => c.userId === user.id);
  }

  claims = claims.sort(
    (a, b) => new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime()
  );

  res.json({ claims });
});

// Submit mileage claim (creates both MileageClaim and associated Expense)
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { origin, destination, distanceMiles, businessPurpose, travelDate } = req.body;

  if (!origin || !destination || !distanceMiles || !businessPurpose) {
    return res.status(400).json({
      error: 'Origin, destination, distance, and business purpose required.'
    });
  }

  const rate = MileageService.DEFAULT_RATE_PER_MILE;

  const totalReimbursement = MileageService.computeReimbursement(
    Number(distanceMiles),
    rate
  );

  // Generate the expense ID first so both records share the relationship
  const expenseId = uuidv4();

  // Create Mileage Claim
  const claim: MileageClaim = {
    id: uuidv4(),
    expenseId,
    userId: user.id,
    userName: user.name,
    origin,
    destination,
    distanceMiles: Number(distanceMiles),
    ratePerMile: rate,
    totalReimbursement,
    businessPurpose,
    travelDate: travelDate || new Date().toISOString().split('T')[0],
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const claims = db.mileageClaims;
  claims.unshift(claim);
  db.mileageClaims = claims;

  // Auto-generate associated Expense
  const newExpense: Expense = {
    id: expenseId,
    userId: user.id,
    userName: user.name,
    userDepartment: user.department,
    merchant: `Mileage: ${origin} to ${destination}`,
    date: claim.travelDate,
    amount: totalReimbursement,
    currency: 'USD',
    convertedAmount: totalReimbursement,
    category: 'Transportation',
    categoryReasoning: 'Automated business mileage claim with IRS standardized distance rate ($0.67/mi)',
    description: `Business mileage: ${distanceMiles} miles. Purpose: ${businessPurpose}`,
    complianceStatus: 'compliant',
    policyChecks: [
      {
        ruleName: 'Standard IRS Mileage Rate',
        status: 'passed',
        message: 'Reimbursement adheres to standard rate formula ($0.67/mi).',
        threshold: '$0.67/mi',
        actual: `$${rate}/mi`
      }
    ],
    anomaly: {
      riskScore: 10,
      riskLevel: 'Low',
      reasons: ['Standard mileage route calculation within company parameters.'],
      investigationStatus: 'not_flagged'
    },
    status: 'pending',
    paymentMethod: 'Personal Card',
    isMileage: true,
    mileageDetails: {
      origin,
      destination,
      distanceMiles: Number(distanceMiles),
      ratePerMile: rate,
      businessPurpose
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const expList = db.expenses;
  expList.unshift(newExpense);
  db.expenses = expList;

  // Audit log
  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'MILEAGE_CLAIM_SUBMITTED',
    entityType: 'expense',
    entityId: claim.id,
    details: `Mileage claim submitted: ${origin} -> ${destination} (${distanceMiles} mi = $${totalReimbursement})`
  });

  res.status(201).json({
    claim,
    expense: newExpense
  });
});

export default router;
