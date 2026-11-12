import { OcrService } from '../services/ocrService';
import { CategorizationService } from '../services/categorizationService';
import { PolicyEngine } from '../services/policyEngine';
import { AnomalyService } from '../services/anomalyService';
import { CurrencyService } from '../services/currencyService';
import { MileageService } from '../services/mileageService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log(' SPENDWISE AI - CORE TEST SUITE');
  console.log('========================================\n');

  // 1. OCR & Image Quality Verification Tests
  console.log('1. OCR Extraction & Quality Checks:');
  const smallBuffer = Buffer.from('abc');
  const qualitySmall = OcrService.checkImageQuality(smallBuffer, 'test.png');
  assert(!qualitySmall.ok, 'Flags images smaller than 3KB as low-resolution/corrupted');

  const blurryQuality = OcrService.checkImageQuality(Buffer.alloc(5000), 'blurry_receipt.png');
  assert(!blurryQuality.ok, 'Detects blurry/unreadable image filenames and triggers retake prompt');

  const normalBuffer = Buffer.alloc(10000);
  const goodQuality = OcrService.checkImageQuality(normalBuffer, 'receipt_marriott.png');
  assert(goodQuality.ok, 'Passes valid standard receipt buffer');

  const parsedReceipt = OcrService.parseReceiptText(
    `DELTA AIR LINES\nDate: 2026-03-08\nFlight DL 1492 Economy $589.20\nTax: $44.19\nTotal: $637.89`,
    'delta_flight.png',
    'sample-hash-123'
  );
  assert(parsedReceipt.merchant === 'DELTA AIR LINES', 'Correctly extracts merchant name "DELTA AIR LINES"');
  assert(parsedReceipt.amount === 637.89, 'Correctly extracts total amount $637.89');
  assert(parsedReceipt.currency === 'USD', 'Identifies currency as USD');
  assert(parsedReceipt.ocrConfidence >= 90, 'Yields high OCR confidence score for clean receipt');

  // 2. Smart Categorization & Explanations Tests
  console.log('\n2. Smart Categorization Engine & Reasoning:');
  const uberCat = CategorizationService.categorize('Uber Technologies Inc', 'Ride to airport');
  assert(uberCat.category === 'Transportation', 'Categorizes Uber as Transportation');
  assert(uberCat.reasoning.includes('merchant'), 'Provides transparent reasoning mentioning matched merchant');

  const awsCat = CategorizationService.categorize('Amazon Web Services', 'Cloud hosting invoice');
  assert(awsCat.category === 'Software & Subscriptions', 'Categorizes AWS as Software & Subscriptions');

  const steakCat = CategorizationService.categorize('The Capital Grille', 'Dinner with team');
  assert(steakCat.category === 'Meals & Entertainment', 'Categorizes restaurant dining as Meals & Entertainment');

  // 3. Deterministic Policy Compliance Engine Tests
  console.log('\n3. Policy Compliance Engine Rules:');
  // 3a. Mandatory Receipt Requirement (> $25)
  const noReceiptSmall = PolicyEngine.evaluateExpense({
    userId: 'user-1',
    merchant: 'Coffee Shop',
    amount: 14.50,
    category: 'Meals & Entertainment',
    date: '2026-03-10',
    description: 'Quick coffee'
  });
  const noReceiptSmallCheck = noReceiptSmall.checks.find(c => c.ruleName === 'Mandatory Receipt Requirement');
  assert(noReceiptSmallCheck?.status === 'passed', 'Expenses <= $25 pass without mandatory receipt');

  const noReceiptBig = PolicyEngine.evaluateExpense({
    userId: 'user-1',
    merchant: 'Executive Dinner',
    amount: 120.00,
    category: 'Meals & Entertainment',
    date: '2026-03-10',
    description: 'No receipt attached'
  });
  const noReceiptBigCheck = noReceiptBig.checks.find(c => c.ruleName === 'Mandatory Receipt Requirement');
  assert(noReceiptBigCheck?.status === 'violation', 'Expenses > $25 without receipt trigger policy violation');

  // 3b. Daily Meal Cap ($75/day)
  const mealOverCap = PolicyEngine.evaluateExpense({
    userId: 'user-1',
    merchant: 'Steakhouse',
    amount: 95.00,
    category: 'Meals & Entertainment',
    date: '2026-03-10',
    description: 'Solo meal',
    receiptUrl: 'https://example.com/receipt.jpg'
  });
  const mealCapCheck = mealOverCap.checks.find(c => c.ruleName === 'Daily Meal Allowance Cap');
  assert(mealCapCheck?.status === 'warning', 'Meal exceeding $75/day triggers policy warning');

  // 3c. Flight Class Restriction (Economy only)
  const flightFirstClass = PolicyEngine.evaluateExpense({
    userId: 'user-1',
    merchant: 'Lufthansa First Class Booking',
    amount: 4200.00,
    category: 'Travel',
    date: '2026-03-10',
    description: 'First Class transatlantic flight',
    receiptUrl: 'https://example.com/ticket.jpg'
  });
  const flightClassCheck = flightFirstClass.checks.find(c => c.ruleName === 'Flight Class Policy');
  assert(flightClassCheck?.status === 'violation', 'First/Business class airfare triggers policy violation');

  // 3d. Single Transaction Cap (>$5,000 violates policy)
  const hugeExpense = PolicyEngine.evaluateExpense({
    userId: 'user-1',
    merchant: 'Enterprise Software Server',
    amount: 7500.00,
    category: 'Software & Subscriptions',
    date: '2026-03-10',
    description: 'Unpreapproved server procurement',
    receiptUrl: 'https://example.com/server.jpg'
  });
  const hugeCheck = hugeExpense.checks.find(c => c.ruleName === 'Maximum Single Transaction Cap');
  assert(hugeCheck?.status === 'violation', 'Single transactions > $5,000 trigger maximum single-item violation');

  // 4. Anomaly & Fraud Detection Engine Tests
  console.log('\n4. Anomaly & Fraud Assessment:');
  const normalAssessment = AnomalyService.assessExpense({
    userId: 'user-1',
    merchant: 'Subway Sandwiches',
    amount: 14.85,
    category: 'Meals & Entertainment',
    date: '2026-03-10'
  });
  assert(normalAssessment.riskLevel === 'Low', 'Standard meal registers as Low Risk');

  const roundNumberAssessment = AnomalyService.assessExpense({
    userId: 'user-1',
    merchant: 'General Consultant',
    amount: 1000.00,
    category: 'Client Meetings',
    date: '2026-03-10'
  });
  assert(roundNumberAssessment.reasons.some(r => r.includes('Round number')), 'Detects round number fabricated pattern');

  // 5. Currency Conversion Tests
  console.log('\n5. Currency Conversion Engine:');
  const eurConv = CurrencyService.convertToUSD(100, 'EUR');
  assert(eurConv.convertedAmount === 108.0, 'Converts 100 EUR to 108.00 USD at standard 1.08 rate');

  const gbpConv = CurrencyService.convertToUSD(100, 'GBP');
  assert(gbpConv.convertedAmount === 128.0, 'Converts 100 GBP to 128.00 USD at standard 1.28 rate');

  const formatted = CurrencyService.format(234.5, 'USD');
  assert(formatted === '$234.50', 'Correctly formats financial currency string');

  // 6. Mileage Routing & Reimbursement Tests
  console.log('\n6. Mileage Distance Routing:');
  const route = MileageService.calculateDistance('San Francisco', 'San Jose');
  assert(route.distanceMiles === 48.5, 'Accurately resolves SF to San Jose routing distance (48.5 miles)');

  const reimb = MileageService.computeReimbursement(route.distanceMiles);
  assert(reimb === 32.50, 'Computes correct reimbursement (48.5 mi * $0.67/mi = $32.50)');

  console.log('\n========================================');
  console.log(` TEST RUN RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
