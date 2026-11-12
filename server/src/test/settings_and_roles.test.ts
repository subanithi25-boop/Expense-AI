import http from 'http';

function post(path: string, body: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode, data: buf });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path: string, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode, data: buf });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(path: string, body: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch {
          resolve({ status: res.statusCode, data: buf });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

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

async function run() {
  console.log('\n======================================================');
  console.log(' SPENDWISE AI - AUTH, ROLES & SETTINGS VERIFICATION');
  console.log('======================================================\n');

  // 1. Normal Sign In - Employee
  console.log('1. Normal Sign-In & Role Authorization:');
  const empLogin = await post('/api/auth/login', { email: 'alex@spendwise.ai', password: 'password123' });
  assert(empLogin.status === 200, 'Employee sign-in succeeds with valid credentials');
  assert(empLogin.data.user.role === 'employee', 'User role is correctly set to "employee"');

  const empToken = empLogin.data.token;
  const empExpenses = await get('/api/expenses', empToken);
  assert(empExpenses.status === 200, 'Employee can query own expenses list');

  const empApprovalAttempt = await get('/api/approvals/pending', empToken);
  assert(empApprovalAttempt.status === 403, 'Employee is strictly blocked from manager approval endpoints (403 Forbidden)');

  // 2. Normal Sign In - Manager
  const mgrLogin = await post('/api/auth/login', { email: 'sarah@spendwise.ai', password: 'password123' });
  assert(mgrLogin.status === 200, 'Manager sign-in succeeds with valid credentials');
  assert(mgrLogin.data.user.role === 'manager', 'User role is correctly set to "manager"');

  const mgrToken = mgrLogin.data.token;
  const mgrApprovals = await get('/api/approvals/pending', mgrToken);
  assert(mgrApprovals.status === 200, 'Manager can access pending approvals desk');
  assert(Array.isArray(mgrApprovals.data.pendingExpenses), 'Approvals desk returns pending expenses');

  // 3. Normal Sign In - Finance
  const finLogin = await post('/api/auth/login', { email: 'david@spendwise.ai', password: 'password123' });
  assert(finLogin.status === 200, 'Finance sign-in succeeds with valid credentials');
  assert(finLogin.data.user.role === 'finance', 'User role is correctly set to "finance"');

  // 4. Normal Sign In - Admin
  const admLogin = await post('/api/auth/login', { email: 'elena@spendwise.ai', password: 'password123' });
  assert(admLogin.status === 200, 'Admin sign-in succeeds with valid credentials');
  assert(admLogin.data.user.role === 'admin', 'User role is correctly set to "admin"');

  const admToken = admLogin.data.token;

  // 5. Corporate Policies Settings Functionality
  console.log('\n2. Corporate Policies & Audit Trail (Settings Features):');
  const policiesRes = await get('/api/policies', admToken);
  assert(policiesRes.status === 200, 'Policies API returns active governance policies');
  assert(Array.isArray(policiesRes.data.policies) && policiesRes.data.policies.length > 0, 'Found configured corporate policies');

  const targetPolicy = policiesRes.data.policies[0];
  const toggleRes = await put(`/api/policies/${targetPolicy.id}`, { active: !targetPolicy.active }, admToken);
  assert(toggleRes.status === 200 && !!toggleRes.data.policy, 'Can update policy status (toggle/edit policy in Settings)');

  // Restore policy status
  await put(`/api/policies/${targetPolicy.id}`, { active: targetPolicy.active }, admToken);

  // 6. System Audit Trail (Settings Feature)
  const auditRes = await get('/api/audit-logs', admToken);
  assert(auditRes.status === 200, 'Audit logs API returns immutable audit trail for management roles');
  assert(Array.isArray(auditRes.data.auditLogs), 'Audit logs list contains audit records');

  // ====================================================================
  // 7. Policy-to-Enforcement Integration Tests
  // Verify that changing policy values in Settings immediately changes
  // the behavior of PolicyEngine during expense submission.
  // ====================================================================
  console.log('\n3. Settings → PolicyEngine Integration (Dynamic Enforcement):');

  // Snapshot original policy values for guaranteed restoration
  const allPoliciesSnapshot = await get('/api/policies', admToken);
  const originalPolicies = allPoliciesSnapshot.data.policies;
  const origPol01 = originalPolicies.find((p: any) => p.id === 'pol-01');
  const origPol02 = originalPolicies.find((p: any) => p.id === 'pol-02');
  const origPol05 = originalPolicies.find((p: any) => p.id === 'pol-05');

  try {
    // ---- 7a. Receipt Threshold: raise from $25 to $50 ----
    // A $40 expense without receipt should now PASS (was violation at $25 threshold)
    await put('/api/policies/pol-01', { requireReceiptAboveAmount: 50 }, admToken);

    const exp40NoReceipt = await post('/api/expenses', {
      merchant: 'Integration Test Office Supplies',
      amount: 40,
      category: 'Office Supplies',
      date: '2026-10-25',
      description: 'Test: $40 without receipt, threshold now $50'
    }, empToken);

    assert(exp40NoReceipt.status === 201, 'Expense submission succeeds for $40 (no receipt, threshold $50)');
    const receiptCheck40 = exp40NoReceipt.data.expense.policyChecks.find(
      (c: any) => c.ruleName === 'Mandatory Receipt Requirement'
    );
    assert(
      receiptCheck40 && receiptCheck40.status === 'passed',
      'Receipt policy PASSES for $40 expense when threshold raised to $50'
    );

    // A $60 expense without receipt should still VIOLATE at the new $50 threshold
    const exp60NoReceipt = await post('/api/expenses', {
      merchant: 'Integration Test Hardware',
      amount: 60,
      category: 'Office Supplies',
      date: '2026-10-25',
      description: 'Test: $60 without receipt, threshold now $50'
    }, empToken);

    assert(exp60NoReceipt.status === 201, 'Expense submission succeeds for $60 (compliance tagging, not blocking)');
    const receiptCheck60 = exp60NoReceipt.data.expense.policyChecks.find(
      (c: any) => c.ruleName === 'Mandatory Receipt Requirement'
    );
    assert(
      receiptCheck60 && receiptCheck60.status === 'violation',
      'Receipt policy VIOLATION for $60 expense when threshold is $50'
    );

    // Restore receipt threshold to original
    await put('/api/policies/pol-01', {
      requireReceiptAboveAmount: origPol01.requireReceiptAboveAmount
    }, admToken);

    // ---- 7b. Meal Allowance Cap: raise from $75 to $100 ----
    // An $85 meal should now PASS (was warning at $75)
    await put('/api/policies/pol-02', { maxDailyAmount: 100 }, admToken);

    const meal85 = await post('/api/expenses', {
      merchant: 'Integration Test Restaurant',
      amount: 85,
      category: 'Meals & Entertainment',
      date: '2026-10-25',
      description: 'Test: $85 meal, cap now $100',
      receiptUrl: 'https://test.example.com/receipt-meal.jpg'
    }, empToken);

    assert(meal85.status === 201, 'Meal expense submission succeeds for $85');
    const mealCheck85 = meal85.data.expense.policyChecks.find(
      (c: any) => c.ruleName === 'Daily Meal Allowance Cap'
    );
    assert(
      mealCheck85 && mealCheck85.status === 'passed',
      'Meal cap PASSES for $85 when allowance raised to $100'
    );

    // Restore meal allowance to original
    await put('/api/policies/pol-02', {
      maxDailyAmount: origPol02.maxDailyAmount
    }, admToken);

    // ---- 7c. Disable Receipt Policy (pol-01 active=false) ----
    // A $100 expense without receipt should produce NO receipt violation check
    await put('/api/policies/pol-01', { active: false }, admToken);

    const exp100Disabled = await post('/api/expenses', {
      merchant: 'Integration Test Disabled Policy',
      amount: 100,
      category: 'Office Supplies',
      date: '2026-10-25',
      description: 'Test: $100 without receipt, policy disabled'
    }, empToken);

    assert(exp100Disabled.status === 201, 'Expense submission succeeds when receipt policy is disabled');
    const receiptCheckDisabled = exp100Disabled.data.expense.policyChecks.find(
      (c: any) => c.ruleName === 'Mandatory Receipt Requirement'
    );
    assert(
      !receiptCheckDisabled,
      'Receipt rule is SKIPPED entirely when policy is disabled (active=false)'
    );

    // Restore receipt policy to active
    await put('/api/policies/pol-01', {
      active: origPol01.active,
      requireReceiptAboveAmount: origPol01.requireReceiptAboveAmount
    }, admToken);

    // ---- 7d. Disable Restricted Vendor Policy (pol-05 active=false) ----
    // A casino expense should now be COMPLIANT (no restricted vendor violation)
    await put('/api/policies/pol-05', { active: false }, admToken);

    const casinoDisabled = await post('/api/expenses', {
      merchant: 'Lucky Casino Resort',
      amount: 15,
      category: 'Other',
      date: '2026-10-25',
      description: 'Test: Casino vendor, restricted policy disabled',
      receiptUrl: 'https://test.example.com/casino-receipt.jpg'
    }, empToken);

    assert(casinoDisabled.status === 201, 'Casino expense submission succeeds when restricted vendor policy is disabled');
    const restrictedCheckDisabled = casinoDisabled.data.expense.policyChecks.find(
      (c: any) => c.ruleName === 'Restricted Category Policy'
    );
    assert(
      !restrictedCheckDisabled,
      'Restricted vendor rule is SKIPPED when policy is disabled (active=false)'
    );

    // Re-enable restricted vendor policy and verify enforcement resumes
    await put('/api/policies/pol-05', {
      active: true
    }, admToken);

    const casinoEnabled = await post('/api/expenses', {
      merchant: 'Lucky Casino Resort',
      amount: 15,
      category: 'Other',
      date: '2026-10-26',
      description: 'Test: Casino vendor, restricted policy re-enabled',
      receiptUrl: 'https://test.example.com/casino-receipt2.jpg'
    }, empToken);

    assert(casinoEnabled.status === 201, 'Casino expense submission succeeds (compliance tags, does not block)');
    const restrictedCheckEnabled = casinoEnabled.data.expense.policyChecks.find(
      (c: any) => c.ruleName === 'Restricted Category Policy'
    );
    assert(
      restrictedCheckEnabled && restrictedCheckEnabled.status === 'violation',
      'Restricted vendor VIOLATION resumes when policy is re-enabled'
    );

  } finally {
    // ---- Guaranteed Restoration ----
    // Always restore original policy values even if assertions above fail
    if (origPol01) {
      await put('/api/policies/pol-01', {
        active: origPol01.active,
        requireReceiptAboveAmount: origPol01.requireReceiptAboveAmount
      }, admToken);
    }
    if (origPol02) {
      await put('/api/policies/pol-02', {
        active: origPol02.active,
        maxDailyAmount: origPol02.maxDailyAmount
      }, admToken);
    }
    if (origPol05) {
      await put('/api/policies/pol-05', {
        active: origPol05.active
      }, admToken);
    }
    console.log('  [cleanup] Original policy values restored.');
  }

  console.log('\n======================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
