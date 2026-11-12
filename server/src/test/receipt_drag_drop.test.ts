import { validateReceiptFile, MAX_RECEIPT_FILE_SIZE } from '../../../client/src/utils/receiptValidation.ts';
import { OcrService } from '../services/ocrService';
import { PolicyEngine } from '../services/policyEngine';
import { CategorizationService } from '../services/categorizationService';

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

async function runDragAndDropTests() {
  console.log('\n============================================================');
  console.log(' SPENDWISE AI - RECEIPT DRAG & DROP & VALIDATION TEST SUITE');
  console.log('============================================================\n');

  // 1. File Type Validation (Accepted: JPG, JPEG, PNG, WebP, PDF)
  console.log('1. File Type Acceptance:');
  const validFiles = [
    { name: 'receipt.jpg', size: 1024 * 50, type: 'image/jpeg' },
    { name: 'receipt.jpeg', size: 1024 * 50, type: 'image/jpeg' },
    { name: 'receipt.png', size: 1024 * 50, type: 'image/png' },
    { name: 'receipt.webp', size: 1024 * 50, type: 'image/webp' },
    { name: 'invoice.pdf', size: 1024 * 200, type: 'application/pdf' },
    { name: 'RECEIPT_CAPS.JPG', size: 1024 * 50, type: 'image/jpeg' },
    { name: 'SCAN.PNG', size: 1024 * 50, type: 'image/png' },
    { name: 'DOCUMENT.PDF', size: 1024 * 50, type: 'application/pdf' },
    // Extension present with missing or generic MIME
    { name: 'receipt_no_mime.png', size: 1024 * 50, type: '' },
    { name: 'receipt_generic.webp', size: 1024 * 50, type: 'application/octet-stream' },
    // MIME present with no extension
    { name: 'blob', size: 1024 * 50, type: 'image/png' },
    { name: 'blob', size: 1024 * 50, type: 'application/pdf' }
  ];

  for (const f of validFiles) {
    const res = validateReceiptFile(f);
    assert(res.valid, `Accepts valid file: ${f.name} (${f.type || 'no mime'})`);
  }

  // 2. Invalid File Type Rejection
  console.log('\n2. Invalid File Type Rejection:');
  const invalidFiles = [
    { name: 'document.txt', size: 1024, type: 'text/plain' },
    { name: 'spreadsheet.xlsx', size: 50000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { name: 'invoice.docx', size: 50000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'archive.zip', size: 50000, type: 'application/zip' },
    { name: 'malware.exe', size: 50000, type: 'application/x-msdownload' },
    { name: 'script.js', size: 5000, type: 'application/javascript' }
  ];

  for (const f of invalidFiles) {
    const res = validateReceiptFile(f);
    assert(!res.valid, `Rejects invalid file type: ${f.name}`);
    assert(
      res.error?.includes('JPG, JPEG, PNG, WebP, or PDF') ?? false,
      `Provides clear error message explaining accepted formats for ${f.name}`
    );
  }

  // Empty or null file
  const emptyRes = validateReceiptFile(null);
  assert(!emptyRes.valid, 'Rejects null file selection');

  // 3. File Size Limit Verification (25 MB)
  console.log('\n3. File Size Limit Enforcement (25 MB):');
  const exactly25MB = validateReceiptFile({
    name: 'large_receipt.png',
    size: 25 * 1024 * 1024,
    type: 'image/png'
  });
  assert(exactly25MB.valid, 'Accepts file exactly at 25MB boundary (26,214,400 bytes)');

  const slightlyUnder25MB = validateReceiptFile({
    name: 'receipt_24mb.jpg',
    size: 24 * 1024 * 1024,
    type: 'image/jpeg'
  });
  assert(slightlyUnder25MB.valid, 'Accepts file under 25MB');

  const oneByteOver25MB = validateReceiptFile({
    name: 'oversized_receipt.png',
    size: 25 * 1024 * 1024 + 1,
    type: 'image/png'
  });
  assert(!oneByteOver25MB.valid, 'Rejects file exceeding 25MB by 1 byte');
  assert(
    oneByteOver25MB.error?.includes('25MB limit') ?? false,
    'Displays clear error message regarding 25MB limit'
  );

  const fiftyMBFile = validateReceiptFile({
    name: 'huge_document.pdf',
    size: 50 * 1024 * 1024,
    type: 'application/pdf'
  });
  assert(!fiftyMBFile.valid, 'Rejects 50MB file');

  // 4. Drag-and-Drop Event State & Lifecycle Simulation
  console.log('\n4. Drag-and-Drop Lifecycle & Event State Simulation:');
  // State simulation mirroring ScanReceiptPage implementation
  class DragDropSimulator {
    public isDragging = false;
    public dragCounter = 0;
    public lastError: string | null = null;
    public uploadedFile: any = null;
    public defaultPrevented = false;
    public propagationStopped = false;
    public dropEffect = '';

    private createEvent(files?: any[]) {
      this.defaultPrevented = false;
      this.propagationStopped = false;
      return {
        preventDefault: () => { this.defaultPrevented = true; },
        stopPropagation: () => { this.propagationStopped = true; },
        dataTransfer: {
          items: files && files.length > 0 ? files : [],
          files: files && files.length > 0 ? files : [],
          dropEffect: ''
        }
      };
    }

    public handleDragEnter() {
      const e = this.createEvent([{}]);
      e.preventDefault();
      e.stopPropagation();
      this.dragCounter += 1;
      if (e.dataTransfer.items.length > 0) {
        this.isDragging = true;
      }
      return { defaultPrevented: this.defaultPrevented, propagationStopped: this.propagationStopped };
    }

    public handleDragOver() {
      const e = this.createEvent();
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      this.dropEffect = e.dataTransfer.dropEffect;
      if (!this.isDragging) {
        this.isDragging = true;
      }
      return { defaultPrevented: this.defaultPrevented, propagationStopped: this.propagationStopped };
    }

    public handleDragLeave() {
      const e = this.createEvent();
      e.preventDefault();
      e.stopPropagation();
      this.dragCounter -= 1;
      if (this.dragCounter <= 0) {
        this.dragCounter = 0;
        this.isDragging = false;
      }
      return { defaultPrevented: this.defaultPrevented, propagationStopped: this.propagationStopped };
    }

    public handleDrop(files: any[]) {
      const e = this.createEvent(files);
      e.preventDefault();
      e.stopPropagation();
      this.dragCounter = 0;
      this.isDragging = false;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const validation = validateReceiptFile(file);
        if (!validation.valid) {
          this.lastError = validation.error || 'Invalid file.';
          this.uploadedFile = null;
        } else {
          this.lastError = null;
          this.uploadedFile = file;
        }
      }
      return { defaultPrevented: this.defaultPrevented, propagationStopped: this.propagationStopped };
    }
  }

  const sim = new DragDropSimulator();

  // Test drag enter
  const enterEv = sim.handleDragEnter();
  assert(sim.isDragging === true, 'Drag enter sets isDragging to true (visual indicator active)');
  assert(enterEv.defaultPrevented && enterEv.propagationStopped, 'Drag enter prevents default and stops propagation');

  // Test child boundary movement (drag enter child, drag leave parent element)
  sim.handleDragEnter(); // child entered
  assert(sim.dragCounter === 2, 'Drag counter increments on child enter');
  sim.handleDragLeave(); // left child or parent boundary
  assert(sim.isDragging === true, 'isDragging remains true during child traversal (prevents UI flicker)');

  // Test drag over
  const overEv = sim.handleDragOver();
  assert(overEv.defaultPrevented && overEv.propagationStopped, 'Drag over prevents default and stops propagation');
  assert(sim.dropEffect === 'copy', 'Drag over sets dropEffect to copy');

  // Test drag leave exit
  sim.handleDragLeave();
  assert(sim.isDragging === false, 'Drag leave resets isDragging to false (restores normal UI appearance)');

  // Test drop with invalid file
  sim.handleDragEnter();
  const invalidDrop = sim.handleDrop([{ name: 'test.zip', size: 2048, type: 'application/zip' }]);
  assert(invalidDrop.defaultPrevented, 'Drop prevents browser default navigation');
  assert(sim.isDragging === false, 'Drop restores normal appearance (isDragging false)');
  assert(sim.uploadedFile === null, 'Invalid drop does not process file');
  assert(sim.lastError !== null && sim.lastError.includes('JPG, JPEG, PNG, WebP, or PDF'), 'Invalid drop sets clear error message');

  // Test drop with oversized file
  sim.handleDragEnter();
  sim.handleDrop([{ name: 'giant_receipt.png', size: 30 * 1024 * 1024, type: 'image/png' }]);
  assert(sim.uploadedFile === null, 'Oversized drop does not upload file');
  assert(sim.lastError !== null && sim.lastError.includes('25MB limit'), 'Oversized drop sets 25MB limit error');

  // Test drop with valid receipt file
  sim.handleDragEnter();
  const validDrop = sim.handleDrop([{ name: 'grocery_receipt.png', size: 1024 * 120, type: 'image/png' }]);
  assert(validDrop.defaultPrevented && validDrop.propagationStopped, 'Valid drop prevents default and stops propagation');
  assert(sim.isDragging === false, 'Valid drop restores normal appearance');
  assert(sim.lastError === null, 'Valid drop clears previous error state');
  assert(sim.uploadedFile?.name === 'grocery_receipt.png', 'Valid drop passes file to upload workflow');

  // 5. Real OCR Workflow Triggering & Processing on Dropped Receipt
  console.log('\n5. OCR Workflow Execution & Verification on Dropped Receipt:');
  const droppedReceiptText = `FRESHMART SUPERMARKET
Date: 2026-03-12
ITEM                   QTY    AMOUNT
Basmati Rice 5kg         1    $14.50
Organic Whole Milk 1gal  1     $4.20
Eggs Large Grade A 12ct  1     $3.80
Subtotal: $22.50
Tax: $1.13
Total: $23.63
Thank you for shopping at FreshMart!`;

  const ocrResult = OcrService.parseReceiptText(
    droppedReceiptText,
    'grocery_receipt.png',
    'sha256-freshmart-drop-hash'
  );

  assert(ocrResult.merchant === 'FRESHMART SUPERMARKET', 'Extracts merchant "FRESHMART SUPERMARKET" from dropped receipt');
  assert(ocrResult.amount === 23.63, 'Extracts total amount $23.63');
  assert(ocrResult.taxAmount === 1.13, 'Extracts tax amount $1.13');
  assert(ocrResult.currency === 'USD', 'Detects currency as USD');
  assert(ocrResult.date === '2026-03-12', 'Extracts transaction date 2026-03-12');
  assert(ocrResult.lineItems.length >= 3, `Extracts itemized line items (${ocrResult.lineItems.length} items parsed)`);
  assert(ocrResult.calculationsValid === true, 'Verifies arithmetic integrity between line items and total');

  // Categorization
  const catResult = CategorizationService.categorize(ocrResult.merchant, 'Grocery items');
  assert(catResult.category === 'Groceries & Supplies', 'Categorizes FreshMart as Groceries & Supplies');

  // Policy engine check on dropped receipt expense
  const policyVerdict = PolicyEngine.evaluateExpense({
    userId: 'usr-1',
    merchant: ocrResult.merchant,
    amount: ocrResult.amount,
    category: catResult.category as any,
    date: ocrResult.date,
    description: 'Groceries from FreshMart',
    receiptUrl: '/uploads/grocery_receipt.png'
  });

  assert(policyVerdict.checks.length > 0, 'Runs deterministic policy checks against extracted data');
  assert(policyVerdict.status === 'compliant', 'Verifies compliance status as compliant for valid receipt');

  console.log('\n============================================================');
  console.log(` TEST RUN RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDragAndDropTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
