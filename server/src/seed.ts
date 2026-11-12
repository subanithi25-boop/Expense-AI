import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { db, DatabaseSchema } from './db';
import {
  User,
  Expense,
  ExpenseReport,
  DepartmentBudget,
  CorporatePolicy,
  MileageClaim,
  NotificationItem,
  AuditLog,
  IntegrationStatus
} from './types';

export function getSeedData(): DatabaseSchema {
  // Pre-hash initial password (password123) synchronously for seed data
  const initialPasswordHash = bcrypt.hashSync('password123', 10);

  const users: User[] = [
    {
      id: 'usr-employee-1',
      name: 'Alex Rivera',
      email: 'alex@spendwise.ai',
      passwordHash: initialPasswordHash,
      role: 'employee',
      department: 'Engineering',
      organizationId: 'org-spendwise-01',
      jobTitle: 'Senior Software Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'usr-manager-1',
      name: 'Sarah Jenkins',
      email: 'sarah@spendwise.ai',
      passwordHash: initialPasswordHash,
      role: 'manager',
      department: 'Engineering',
      organizationId: 'org-spendwise-01',
      jobTitle: 'Director of Engineering',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:00:00Z'
    },
    {
      id: 'usr-finance-1',
      name: 'David Chen',
      email: 'david@spendwise.ai',
      passwordHash: initialPasswordHash,
      role: 'finance',
      department: 'Finance',
      organizationId: 'org-spendwise-01',
      jobTitle: 'Corporate Financial Controller',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-02T08:00:00Z'
    },
    {
      id: 'usr-admin-1',
      name: 'Elena Rostova',
      email: 'elena@spendwise.ai',
      passwordHash: initialPasswordHash,
      role: 'admin',
      department: 'Executive Operations',
      organizationId: 'org-spendwise-01',
      jobTitle: 'VP Operations & System Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-01T08:00:00Z'
    }
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-101',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'Delta Air Lines',
      date: '2026-03-14',
      amount: 637.89,
      currency: 'USD',
      convertedAmount: 637.89,
      category: 'Travel',
      categoryReasoning: 'Flight ticket booking (DL 1492 JFK -> SFO Economy Class)',
      description: 'Flight to Q1 Architecture Summit in San Francisco',
      receiptUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-delta-001',
      ocrConfidence: 97,
      lineItems: [
        { description: 'Flight DL 1492 Economy', amount: 589.20 },
        { description: 'Federal Transportation Tax', amount: 44.19 },
        { description: 'Passenger Facility Charge', amount: 4.50 }
      ],
      complianceStatus: 'compliant',
      policyChecks: [
        { ruleName: 'Flight Class Policy', status: 'passed', message: 'Standard Economy booking confirmed.', threshold: 'Economy', actual: 'Economy' },
        { ruleName: 'Mandatory Receipt Requirement', status: 'passed', message: 'Receipt attached.', threshold: '$25.00', actual: 'Attached' }
      ],
      anomaly: {
        riskScore: 12,
        riskLevel: 'Low',
        reasons: ['Standard commercial flight booking within company guidelines.'],
        investigationStatus: 'not_flagged'
      },
      status: 'approved',
      paymentMethod: 'Corporate Card',
      createdAt: '2026-03-14T15:20:00Z',
      updatedAt: '2026-03-14T15:20:00Z'
    },
    {
      id: 'exp-102',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'Marriott Downtown',
      date: '2026-03-12',
      amount: 425.60,
      currency: 'USD',
      convertedAmount: 425.60,
      category: 'Accommodation',
      categoryReasoning: 'Hotel guest folio for 2 nights lodging',
      description: 'Lodging during client technical discovery workshop',
      receiptUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-marriott-002',
      ocrConfidence: 94,
      lineItems: [
        { description: 'Standard King Room (2 nights)', amount: 380.00 },
        { description: 'City Occupancy Tax', amount: 45.60 }
      ],
      complianceStatus: 'compliant',
      policyChecks: [
        { ruleName: 'Hotel Cap Guideline', status: 'passed', message: '$190/night rate is within $250/night destination limit.', threshold: '$250/night', actual: '$190/night' }
      ],
      anomaly: {
        riskScore: 18,
        riskLevel: 'Low',
        reasons: ['Expected accommodation spend for multi-day onsite.'],
        investigationStatus: 'not_flagged'
      },
      status: 'reimbursed',
      paymentMethod: 'Personal Card',
      createdAt: '2026-03-12T10:15:00Z',
      updatedAt: '2026-03-15T09:00:00Z'
    },
    {
      id: 'exp-103',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'The Capital Grille',
      date: '2026-03-15',
      amount: 200.46,
      currency: 'USD',
      convertedAmount: 200.46,
      category: 'Meals & Entertainment',
      categoryReasoning: 'Dinner restaurant receipt with food & beverage breakdown',
      description: 'Team technical debrief dinner for 4 engineers',
      receiptUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-capitol-003',
      ocrConfidence: 95,
      complianceStatus: 'warning',
      policyChecks: [
        {
          ruleName: 'Daily Meal Allowance Cap',
          status: 'warning',
          message: 'Single meal check of $200.46 exceeds $75.00 individual limit. Multi-attendee note required.',
          threshold: '$75.00',
          actual: '$200.46 ($50.11/person)'
        }
      ],
      anomaly: {
        riskScore: 38,
        riskLevel: 'Medium',
        reasons: ['Elevated meal total. Verified 4 team attendees split cost below individual allowance threshold.'],
        investigationStatus: 'under_review'
      },
      status: 'pending',
      paymentMethod: 'Personal Card',
      createdAt: '2026-03-15T21:40:00Z',
      updatedAt: '2026-03-15T21:40:00Z'
    },
    {
      id: 'exp-104',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'Amazon Web Services',
      date: '2026-03-01',
      amount: 189.10,
      currency: 'USD',
      convertedAmount: 189.10,
      category: 'Software & Subscriptions',
      categoryReasoning: 'Monthly cloud infrastructure invoice',
      description: 'Staging environment GPU clusters for SpendWise AI OCR model testing',
      receiptUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-aws-004',
      ocrConfidence: 99,
      complianceStatus: 'compliant',
      policyChecks: [
        { ruleName: 'Mandatory Receipt Requirement', status: 'passed', message: 'Invoice verified.', threshold: '$25.00', actual: 'Verified' }
      ],
      anomaly: {
        riskScore: 8,
        riskLevel: 'Low',
        reasons: ['Recurring cloud infrastructure charge.'],
        investigationStatus: 'not_flagged'
      },
      status: 'approved',
      paymentMethod: 'Corporate Card',
      createdAt: '2026-03-01T04:00:00Z',
      updatedAt: '2026-03-02T11:00:00Z'
    },
    {
      id: 'exp-105',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'Lufthansa First Class',
      date: '2026-03-16',
      amount: 4850.00,
      currency: 'EUR',
      exchangeRate: 1.08,
      convertedAmount: 5238.00,
      category: 'Travel',
      categoryReasoning: 'International flight ticket booking',
      description: 'Urgent transatlantic flight to European engineering partner HQ',
      receiptUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-lufthansa-005',
      ocrConfidence: 92,
      complianceStatus: 'violation',
      policyChecks: [
        {
          ruleName: 'Flight Class Policy',
          status: 'violation',
          message: 'First Class airfare exceeds permitted Economy tier. VP pre-approval not detected.',
          threshold: 'Economy Class',
          actual: 'First Class (€4,850.00)'
        },
        {
          ruleName: 'Maximum Single Transaction Cap',
          status: 'violation',
          message: 'Transaction ($5,238.00) exceeds $5,000 corporate single-item threshold.',
          threshold: '$5,000.00',
          actual: '$5,238.00'
        }
      ],
      anomaly: {
        riskScore: 85,
        riskLevel: 'High',
        reasons: [
          'High anomaly risk: Flight cost is 6.5x department travel benchmark.',
          'Policy violation: First Class booking without procurement exemption.'
        ],
        investigationStatus: 'flagged'
      },
      status: 'pending',
      paymentMethod: 'Corporate Card',
      createdAt: '2026-03-16T12:00:00Z',
      updatedAt: '2026-03-16T12:00:00Z'
    },
    {
      id: 'exp-106',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'Uber Technologies',
      date: '2026-03-12',
      amount: 37.43,
      currency: 'USD',
      convertedAmount: 37.43,
      category: 'Transportation',
      categoryReasoning: 'Ground transit from SFO Terminal 2 to downtown hotel',
      description: 'Airport transfer to hotel',
      receiptUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-uber-006',
      ocrConfidence: 98,
      complianceStatus: 'compliant',
      policyChecks: [
        { ruleName: 'Ground Transport Policy', status: 'passed', message: 'Airport transit is permitted.', threshold: '$50.00', actual: '$37.43' }
      ],
      anomaly: {
        riskScore: 10,
        riskLevel: 'Low',
        reasons: ['Standard ground transit during business travel.'],
        investigationStatus: 'not_flagged'
      },
      status: 'reimbursed',
      paymentMethod: 'Personal Card',
      createdAt: '2026-03-12T18:30:00Z',
      updatedAt: '2026-03-15T09:00:00Z'
    },
    {
      id: 'exp-107',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      merchant: 'Staples Office Supplies',
      date: '2026-03-10',
      amount: 320.00,
      currency: 'USD',
      convertedAmount: 320.00,
      category: 'Office Supplies',
      categoryReasoning: 'Workstation monitors and ergonomic keyboards',
      description: 'Split equipment expense for engineering and product sprint room',
      receiptUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
      receiptHash: 'hash-staples-007',
      ocrConfidence: 96,
      splits: [
        { category: 'Office Supplies', department: 'Engineering', project: 'Core Platform', amount: 200.00, percentage: 62.5 },
        { category: 'Office Supplies', department: 'Product', project: 'Design Sprint', amount: 120.00, percentage: 37.5 }
      ],
      complianceStatus: 'compliant',
      policyChecks: [
        { ruleName: 'Multi-Department Split Allocation', status: 'passed', message: 'Allocations balance exactly to $320.00 total.', threshold: '100% split match', actual: 'Balanced' }
      ],
      anomaly: {
        riskScore: 15,
        riskLevel: 'Low',
        reasons: ['Multi-department split verified against cost-center allocation.'],
        investigationStatus: 'not_flagged'
      },
      status: 'approved',
      paymentMethod: 'Corporate Card',
      createdAt: '2026-03-10T14:10:00Z',
      updatedAt: '2026-03-11T16:00:00Z'
    }
  ];

  const reports: ExpenseReport[] = [
    {
      id: 'rep-001',
      reportNumber: 'EXP-2026-0001',
      title: 'Q1 San Francisco Architecture Summit',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      startDate: '2026-03-10',
      endDate: '2026-03-15',
      expenseIds: ['exp-101', 'exp-102', 'exp-103', 'exp-106'],
      totalAmount: 1301.38,
      currency: 'USD',
      status: 'submitted',
      submittedAt: '2026-03-16T09:00:00Z',
      complianceSummary: {
        compliantCount: 3,
        warningCount: 1,
        violationCount: 0
      },
      createdAt: '2026-03-15T18:00:00Z'
    },
    {
      id: 'rep-002',
      reportNumber: 'EXP-2026-0002',
      title: 'February Software Tools & Staging Infrastructure',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      userDepartment: 'Engineering',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      expenseIds: ['exp-104', 'exp-107'],
      totalAmount: 509.10,
      currency: 'USD',
      status: 'reimbursed',
      submittedAt: '2026-03-01T10:00:00Z',
      approvedAt: '2026-03-02T14:00:00Z',
      reimbursedAt: '2026-03-04T16:30:00Z',
      reviewerNotes: 'Verified against Q1 technical tools stipend.',
      complianceSummary: {
        compliantCount: 2,
        warningCount: 0,
        violationCount: 0
      },
      createdAt: '2026-02-28T17:00:00Z'
    }
  ];

  const budgets: DepartmentBudget[] = [
    {
      id: 'bgt-eng',
      department: 'Engineering',
      fiscalYear: 2026,
      month: 3,
      monthlyAllocation: 45000,
      allocatedCategories: {
        'Travel': 12000,
        'Software & Subscriptions': 18000,
        'Office Supplies': 5000,
        'Meals & Entertainment': 4000,
        'Training & Education': 6000
      },
      spentAmount: 8200,
      pendingAmount: 5638.46
    },
    {
      id: 'bgt-sales',
      department: 'Sales',
      fiscalYear: 2026,
      month: 3,
      monthlyAllocation: 60000,
      allocatedCategories: {
        'Travel': 28000,
        'Meals & Entertainment': 16000,
        'Client Meetings': 10000,
        'Transportation': 6000
      },
      spentAmount: 38400,
      pendingAmount: 9200
    },
    {
      id: 'bgt-marketing',
      department: 'Marketing',
      fiscalYear: 2026,
      month: 3,
      monthlyAllocation: 35000,
      allocatedCategories: {
        'Software & Subscriptions': 12000,
        'Travel': 8000,
        'Client Meetings': 9000,
        'Office Supplies': 6000
      },
      spentAmount: 14200,
      pendingAmount: 3400
    },
    {
      id: 'bgt-product',
      department: 'Product',
      fiscalYear: 2026,
      month: 3,
      monthlyAllocation: 25000,
      allocatedCategories: {
        'Software & Subscriptions': 10000,
        'Travel': 7000,
        'Training & Education': 5000,
        'Meals & Entertainment': 3000
      },
      spentAmount: 9400,
      pendingAmount: 1800
    },
    {
      id: 'bgt-ops',
      department: 'Operations',
      fiscalYear: 2026,
      month: 3,
      monthlyAllocation: 20000,
      allocatedCategories: {
        'Utilities': 8000,
        'Office Supplies': 6000,
        'Transportation': 3000,
        'Other': 3000
      },
      spentAmount: 11200,
      pendingAmount: 1500
    }
  ];

  const policies: CorporatePolicy[] = [
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

  const mileageClaims: MileageClaim[] = [
    {
      id: 'mil-001',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      origin: 'San Francisco HQ (Market St)',
      destination: 'Client Campus - San Jose Tech Center',
      distanceMiles: 48.5,
      ratePerMile: 0.67,
      totalReimbursement: 32.50,
      businessPurpose: 'Onsite deployment architecture review with enterprise customer',
      travelDate: '2026-03-11',
      status: 'approved',
      createdAt: '2026-03-11T17:00:00Z'
    },
    {
      id: 'mil-002',
      userId: 'usr-employee-1',
      userName: 'Alex Rivera',
      origin: 'San Francisco HQ',
      destination: 'Oakland Data Facility',
      distanceMiles: 12.4,
      ratePerMile: 0.67,
      totalReimbursement: 8.31,
      businessPurpose: 'Emergency server hardware inspection',
      travelDate: '2026-03-15',
      status: 'pending',
      createdAt: '2026-03-15T19:30:00Z'
    }
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'usr-employee-1',
      title: 'Expense Reimbursed: $425.60',
      message: 'Finance has processed reimbursement for Marriott Downtown (#EXP-2026-0002). Direct deposit initiated.',
      type: 'reimbursement',
      read: false,
      link: '/dashboard/reports/rep-002',
      createdAt: '2026-03-15T09:00:00Z'
    },
    {
      id: 'notif-2',
      userId: 'usr-employee-1',
      title: 'Policy Notice: Daily Meal Cap',
      message: 'Your expense for The Capital Grille ($200.46) was flagged with a warning for exceeding the standard $75 daily allowance.',
      type: 'policy',
      read: false,
      link: '/dashboard/expenses?id=exp-103',
      createdAt: '2026-03-15T21:40:00Z'
    },
    {
      id: 'notif-3',
      userId: 'usr-manager-1',
      title: 'Action Required: High-Risk Travel Expense',
      message: 'Alex Rivera submitted an expense of $5,238.00 (Lufthansa First Class) requiring management review.',
      type: 'anomaly',
      read: false,
      link: '/dashboard/approvals?expenseId=exp-105',
      createdAt: '2026-03-16T12:05:00Z'
    },
    {
      id: 'notif-4',
      userId: 'usr-employee-1',
      title: 'OCR Extraction Successful',
      message: 'Receipt from Staples Office Supplies was parsed with 96% accuracy and auto-categorized under Office Supplies.',
      type: 'system',
      read: true,
      link: '/dashboard/expenses?id=exp-107',
      createdAt: '2026-03-10T14:15:00Z'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      actorId: 'usr-employee-1',
      actorName: 'Alex Rivera',
      actorRole: 'employee',
      action: 'EXPENSE_SUBMITTED',
      entityType: 'expense',
      entityId: 'exp-105',
      details: 'Submitted expense for Lufthansa First Class ($5,238.00 USD) - Policy Status: violation',
      timestamp: '2026-03-16T12:00:00Z'
    },
    {
      id: 'aud-2',
      actorId: 'usr-manager-1',
      actorName: 'Sarah Jenkins',
      actorRole: 'manager',
      action: 'EXPENSE_APPROVED',
      entityType: 'expense',
      entityId: 'exp-101',
      details: 'Approved Delta Air Lines ticket ($637.89)',
      timestamp: '2026-03-14T16:00:00Z'
    },
    {
      id: 'aud-3',
      actorId: 'usr-finance-1',
      actorName: 'David Chen',
      actorRole: 'finance',
      action: 'REPORT_STATUS_REIMBURSED',
      entityType: 'report',
      entityId: 'rep-002',
      details: 'Report EXP-2026-0002 ($509.10) verified and marked as disbursed',
      timestamp: '2026-03-04T16:30:00Z'
    }
  ];

  const integrations: IntegrationStatus[] = [
    {
      id: 'int-tesseract',
      providerKey: 'tesseract',
      name: 'Tesseract OCR Engine',
      category: 'OCR & AI',
      description: 'Local on-premise receipt text optical character recognition with client fallback support.',
      status: 'connected',
      lastSync: '2026-03-16T10:00:00Z',
      configuredBy: 'Elena Rostova',
      credentialsRequired: ['Engine Binary', 'Language Pack']
    },
    {
      id: 'int-rates',
      providerKey: 'exchange_rate',
      name: 'ExchangeRate-API',
      category: 'Services',
      description: 'Global daily foreign exchange rates supporting EUR, GBP, CAD, JPY, AUD conversion.',
      status: 'connected',
      lastSync: '2026-03-16T06:00:00Z',
      configuredBy: 'David Chen',
      credentialsRequired: ['API Key', 'Base Currency']
    },
    {
      id: 'int-gvision',
      providerKey: 'google_vision',
      name: 'Google Cloud Vision OCR',
      category: 'OCR & AI',
      description: 'High-precision cloud document recognition with multi-language and line-item extraction.',
      status: 'demo_mode',
      lastSync: '2026-03-15T18:00:00Z',
      configuredBy: 'Alex Rivera',
      credentialsRequired: ['Google Cloud Service Account JSON', 'Project ID']
    },
    {
      id: 'int-quickbooks',
      providerKey: 'quickbooks',
      name: 'Intuit QuickBooks Online',
      category: 'Accounting',
      description: 'Syncs approved expense accounts, tax codes, vendor ledger entries, and general ledger journal entries.',
      status: 'demo_mode',
      lastSync: '2026-03-14T22:00:00Z',
      configuredBy: 'David Chen',
      credentialsRequired: ['Client ID', 'Client Secret', 'Company Realm ID']
    },
    {
      id: 'int-xero',
      providerKey: 'xero',
      name: 'Xero Accounting',
      category: 'Accounting',
      description: 'Direct synchronization with Xero chart of accounts, bank feeds, and employee bills.',
      status: 'not_connected',
      credentialsRequired: ['OAuth 2.0 Client ID', 'Client Secret', 'Tenant ID']
    },
    {
      id: 'int-sap',
      providerKey: 'sap_concur',
      name: 'SAP Concur',
      category: 'ERP',
      description: 'Enterprise ERP travel and expense sync adapter for global corporate compliance.',
      status: 'not_connected',
      credentialsRequired: ['Concur API Gateway Key', 'OAuth Refresh Token', 'Company Domain']
    },
    {
      id: 'int-expensify',
      providerKey: 'expensify',
      name: 'Expensify Integration Adapter',
      category: 'Accounting',
      description: 'Receipt report import/export pipe connecting corporate cards and Expensify SmartScan.',
      status: 'demo_mode',
      lastSync: '2026-03-13T11:00:00Z',
      configuredBy: 'Elena Rostova',
      credentialsRequired: ['Partner User ID', 'Partner User Secret']
    },
    {
      id: 'int-maps',
      providerKey: 'maps',
      name: 'Google Maps / Routing Matrix',
      category: 'Services',
      description: 'Automated distance calculation and routing matrix for compliant mileage reimbursements.',
      status: 'connected',
      lastSync: '2026-03-16T08:00:00Z',
      configuredBy: 'Alex Rivera',
      credentialsRequired: ['Google Maps Directions API Key']
    }
  ];

  return {
    users,
    expenses,
    reports,
    budgets,
    policies,
    mileageClaims,
    notifications,
    auditLogs,
    integrations
  };
}

export function seedDatabase() {
  const data = getSeedData();
  db.resetAll(data);
  console.log('[Seed] Database initialized with enterprise seed data for SpendWise AI.');
}

if (require.main === module) {
  seedDatabase();
}
