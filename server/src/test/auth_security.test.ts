import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import authRoutes from '../routes/authRoutes';
import { JWT_SECRET, authenticate } from '../middleware/authMiddleware';
import { validateEmail, validatePasswordStrength } from '../utils/validation';

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

/**
 * Executes a simulated HTTP call into an Express router or middleware in-process.
 */
function invokeRoute(
  router: any,
  method: 'GET' | 'POST',
  path: string,
  body: any = {},
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    let statusCode = 200;
    let responseBody: any = null;

    const req: any = {
      method,
      url: path,
      path,
      body,
      headers: {
        'x-test-bypass-ratelimit': 'true',
        ...headers
      },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' }
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: any) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody });
        return res;
      },
      setHeader() {
        return res;
      }
    };

    const next = (err?: any) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message || err } });
      } else {
        resolve({ status: 404, body: { error: 'Not Found' } });
      }
    };

    router.handle(req, res, next);
  });
}

function invokeMiddleware(
  middleware: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; user?: any }> {
  return new Promise((resolve) => {
    let statusCode = 200;
    let responseBody: any = null;

    const req: any = {
      headers,
      ip: '127.0.0.1'
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return res;
      },
      json(data: any) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody });
        return res;
      }
    };

    const next = () => {
      resolve({ status: 200, body: null, user: req.user });
    };

    middleware(req, res, next);
  });
}

async function runAuthSecurityTests() {
  console.log('\n=============================================================');
  console.log(' SPENDWISE AI - AUTHENTICATION & SECURITY VERIFICATION SUITE');
  console.log('=============================================================\n');

  const uniqueTimestamp = Date.now();
  const validTestEmail = `sec_user_${uniqueTimestamp}@spendwise.ai`;
  const strongPassword = 'Password123!@#';

  // -------------------------------------------------------------
  // Scenario 1: Register with a valid email and strong password
  // -------------------------------------------------------------
  console.log('1. Registration - Valid Email and Strong Password:');
  const reg1 = await invokeRoute(authRoutes, 'POST', '/register', {
    name: 'Security Test User',
    email: `  ${validTestEmail}  `, // Includes leading/trailing spaces to test trimming
    password: strongPassword,
    confirmPassword: strongPassword,
    role: 'employee',
    department: 'Engineering'
  });
  assert(reg1.status === 201, 'Registration returns 201 Created');
  assert(!!reg1.body?.token, 'Registration returns signed JWT authentication token');
  assert(reg1.body?.user?.email === validTestEmail.toLowerCase(), 'Registration trims email and normalizes to lowercase');
  assert(reg1.body?.user?.passwordHash === undefined, 'Never exposes passwordHash in registration response');

  // -------------------------------------------------------------
  // Scenario 2: Register with an invalid email
  // -------------------------------------------------------------
  console.log('\n2. Registration - Invalid Email Formats:');
  const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain', 'spaces in@mail.com'];
  for (const badEmail of invalidEmails) {
    const regInvalid = await invokeRoute(authRoutes, 'POST', '/register', {
      name: 'Invalid Email User',
      email: badEmail,
      password: strongPassword
    });
    assert(regInvalid.status === 400, `Rejects invalid email format: "${badEmail}" with 400 Bad Request`);
    assert(regInvalid.body?.error?.includes('valid email'), `Clear error message returned for "${badEmail}"`);
  }

  // -------------------------------------------------------------
  // Scenario 3: Register with an already existing email
  // -------------------------------------------------------------
  console.log('\n3. Registration - Prevent Duplicate Accounts:');
  const regDuplicate = await invokeRoute(authRoutes, 'POST', '/register', {
    name: 'Duplicate User',
    email: validTestEmail.toUpperCase(), // Case-insensitive collision check
    password: strongPassword
  });
  assert(regDuplicate.status === 409, 'Rejects duplicate registration with 409 Conflict');
  assert(regDuplicate.body?.error?.toLowerCase().includes('already exists'), 'Displays clear message that account already exists');

  // -------------------------------------------------------------
  // Scenario 4: Register with a weak password
  // -------------------------------------------------------------
  console.log('\n4. Registration - Password Complexity Requirements:');
  const weakPasswords = [
    { pwd: 'short', reason: 'Under 8 characters' },
    { pwd: 'alllowercase1!', reason: 'No uppercase letter' },
    { pwd: 'ALLUPPERCASE1!', reason: 'No lowercase letter' },
    { pwd: 'NoNumbersHere!', reason: 'No numeric digit' },
    { pwd: 'NoSpecialChars123', reason: 'No special character' },
    { pwd: '   ', reason: 'Whitespace-only password' }
  ];
  for (const { pwd, reason } of weakPasswords) {
    const regWeak = await invokeRoute(authRoutes, 'POST', '/register', {
      name: 'Weak Password User',
      email: `weak_${Date.now()}_${Math.random().toString(36).substring(7)}@spendwise.ai`,
      password: pwd
    });
    assert(regWeak.status === 400, `Rejects weak password (${reason}) with 400 Bad Request`);
  }

  // -------------------------------------------------------------
  // Scenario 5: Register with mismatched passwords
  // -------------------------------------------------------------
  console.log('\n5. Registration - Password Confirmation Match:');
  const regMismatch = await invokeRoute(authRoutes, 'POST', '/register', {
    name: 'Mismatch User',
    email: `mismatch_${Date.now()}@spendwise.ai`,
    password: strongPassword,
    confirmPassword: 'DifferentPassword123!'
  });
  assert(regMismatch.status === 400, 'Rejects mismatched passwords with 400 Bad Request');
  assert(regMismatch.body?.error?.includes('match'), 'Returns clear mismatch error message');

  // -------------------------------------------------------------
  // Scenario 6: Login with correct existing credentials
  // -------------------------------------------------------------
  console.log('\n6. Login - Correct Credentials (Newly registered user):');
  const loginNew = await invokeRoute(authRoutes, 'POST', '/login', {
    email: `  ${validTestEmail.toUpperCase()}  `, // Test whitespace trimming & case insensitivity
    password: strongPassword
  });
  assert(loginNew.status === 200, 'Newly registered user can log in immediately (200 OK)');
  assert(!!loginNew.body?.token, 'Login returns valid JWT bearer token');
  assert(loginNew.body?.user?.email === validTestEmail.toLowerCase(), 'Login returns verified user profile');
  assert(loginNew.body?.user?.passwordHash === undefined, 'Never exposes passwordHash in login response');

  // -------------------------------------------------------------
  // Scenario 7: Login with an incorrect password
  // -------------------------------------------------------------
  console.log('\n7. Login - Incorrect Password:');
  const loginWrongPass = await invokeRoute(authRoutes, 'POST', '/login', {
    email: validTestEmail,
    password: 'WrongPassword999!'
  });
  assert(loginWrongPass.status === 401, 'Rejects incorrect password with 401 Unauthorized');
  assert(loginWrongPass.body?.error === 'Invalid email or password.', 'Generic error message (does not reveal password specifics)');

  // -------------------------------------------------------------
  // Scenario 8: Login with an invalid email / non-existent email
  // -------------------------------------------------------------
  console.log('\n8. Login - Invalid Email / Non-existent Email:');
  const loginInvalidEmail = await invokeRoute(authRoutes, 'POST', '/login', {
    email: 'not-an-email',
    password: strongPassword
  });
  assert(loginInvalidEmail.status === 400, 'Rejects malformed email on login with 400 Bad Request');

  const loginNonExistent = await invokeRoute(authRoutes, 'POST', '/login', {
    email: 'does_not_exist_99999@spendwise.ai',
    password: strongPassword
  });
  assert(loginNonExistent.status === 401, 'Rejects non-existent email with 401 Unauthorized');
  assert(loginNonExistent.body?.error === 'Invalid email or password.', 'Generic error message (does not reveal whether email exists)');

  // -------------------------------------------------------------
  // Scenario 9: Login with empty fields
  // -------------------------------------------------------------
  console.log('\n9. Login - Empty and Whitespace Fields:');
  const loginEmptyEmail = await invokeRoute(authRoutes, 'POST', '/login', { email: '', password: strongPassword });
  assert(loginEmptyEmail.status === 400, 'Rejects empty email with 400 Bad Request');

  const loginEmptyPass = await invokeRoute(authRoutes, 'POST', '/login', { email: validTestEmail, password: '' });
  assert(loginEmptyPass.status === 400, 'Rejects empty password with 400 Bad Request');

  const loginEmptyBoth = await invokeRoute(authRoutes, 'POST', '/login', {});
  assert(loginEmptyBoth.status === 400, 'Rejects missing fields with 400 Bad Request');

  // -------------------------------------------------------------
  // Scenario 10: Verify that passwords are hashed in the database
  // -------------------------------------------------------------
  console.log('\n10. Database Security - Passwords Hashed with bcrypt:');
  const savedUser = db.users.find(u => u.email === validTestEmail.toLowerCase());
  assert(!!savedUser, 'User is safely persisted in database');
  assert(!!savedUser?.passwordHash, 'User has passwordHash stored');
  assert(savedUser?.passwordHash !== strongPassword, 'Password is NOT stored in plain text');
  assert(savedUser?.passwordHash.startsWith('$2a$') || savedUser?.passwordHash.startsWith('$2b$'), 'Password hash uses standard bcrypt format ($2a$/$2b$)');
  assert(bcrypt.compareSync(strongPassword, savedUser!.passwordHash), 'bcrypt verifies the password correctly against stored hash');

  // -------------------------------------------------------------
  // Scenario 11: Verify protected dashboard endpoints cannot be accessed without authentication
  // -------------------------------------------------------------
  console.log('\n11. Protected Route Middleware Enforcement:');
  const noTokenRes = await invokeMiddleware(authenticate, {});
  assert(noTokenRes.status === 401, 'Rejects requests with missing Authorization header (401 Unauthorized)');

  const badTokenRes = await invokeMiddleware(authenticate, { authorization: 'Bearer invalid.token.value' });
  assert(badTokenRes.status === 401, 'Rejects forged or expired tokens (401 Unauthorized)');

  const validTokenRes = await invokeMiddleware(authenticate, { authorization: `Bearer ${loginNew.body.token}` });
  assert(validTokenRes.status === 200, 'Allows requests with valid JWT bearer token');
  assert(validTokenRes.user?.email === validTestEmail.toLowerCase(), 'Middleware attaches verified User to request object');

  // -------------------------------------------------------------
  // Scenario 12: Verify that existing user accounts still work
  // -------------------------------------------------------------
  console.log('\n12. Backward Compatibility - Existing User Accounts:');
  const existingAccounts = [
    { email: 'alex@spendwise.ai', role: 'employee' },
    { email: 'sarah@spendwise.ai', role: 'manager' },
    { email: 'david@spendwise.ai', role: 'finance' },
    { email: 'elena@spendwise.ai', role: 'admin' }
  ];
  for (const acc of existingAccounts) {
    const loginExisting = await invokeRoute(authRoutes, 'POST', '/login', {
      email: acc.email,
      password: 'password123'
    });
    assert(loginExisting.status === 200, `Existing user ${acc.email} (${acc.role}) logs in successfully`);
    assert(loginExisting.body?.user?.role === acc.role, `Existing user role verified: ${acc.role}`);
  }

  // -------------------------------------------------------------
  // Scenario 13: Verify all demo access endpoints have been completely removed
  // -------------------------------------------------------------
  console.log('\n13. Demo Elimination - Endpoints Removed:');
  const demoUsersRes = await invokeRoute(authRoutes, 'GET', '/demo-users');
  assert(demoUsersRes.status === 404, 'GET /api/auth/demo-users endpoint returns 404 Not Found (removed)');

  const switchDemoRes = await invokeRoute(authRoutes, 'POST', '/switch-demo', { role: 'admin' });
  assert(switchDemoRes.status === 404, 'POST /api/auth/switch-demo endpoint returns 404 Not Found (removed)');

  console.log('\n=============================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthSecurityTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
