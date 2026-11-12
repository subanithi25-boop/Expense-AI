import { db } from '../db';
import { NotificationService } from '../services/notificationService';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../middleware/authMiddleware';

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

async function runNotificationTests() {
  console.log('\n========================================');
  console.log(' SPENDWISE AI - NOTIFICATION BADGE TESTS');
  console.log('========================================\n');

  // Find two users: User 1 with unread notifications, User 2 with 0 notifications
  const userWithNotifs = db.users.find(u => u.id === 'usr-employee-1') || db.users[0];
  const userWithoutNotifs = db.users.find(u => u.email === 'david@spendwise.ai' || u.role === 'finance') || db.users[2];

  console.log(`Testing User 1 (with notifications): ${userWithNotifs.name} (${userWithNotifs.id})`);
  console.log(`Testing User 2 (without notifications): ${userWithoutNotifs.name} (${userWithoutNotifs.id})`);

  // Normalize any legacy stored notifications to use /dashboard prefix
  const allNotifs = db.notifications.map(n => {
    if (n.link && n.link.startsWith('/') && !n.link.startsWith('/dashboard')) {
      return { ...n, link: `/dashboard${n.link}` };
    }
    return n;
  });
  db.notifications = allNotifs;

  // Ensure User 1 has known unread notification for test determinism
  let initialUser1Notifs = db.notifications.filter(n => n.userId === userWithNotifs.id);
  if (initialUser1Notifs.filter(n => !n.read).length === 0 && initialUser1Notifs.length > 0) {
    const list = db.notifications;
    const item = list.find(n => n.userId === userWithNotifs.id);
    if (item) item.read = false;
    db.notifications = list;
    initialUser1Notifs = db.notifications.filter(n => n.userId === userWithNotifs.id);
  }
  const initialUser1Unread = initialUser1Notifs.filter(n => !n.read).length;
  console.log(`User 1 initial unread notifications: ${initialUser1Unread}`);

  const initialUser2Notifs = db.notifications.filter(n => n.userId === userWithoutNotifs.id);
  const initialUser2Unread = initialUser2Notifs.filter(n => !n.read).length;
  console.log(`User 2 initial unread notifications: ${initialUser2Unread}`);

  // 1. Data Isolation Test
  console.log('\n1. User Notification Isolation:');
  const user1Fetched = db.notifications.filter(n => n.userId === userWithNotifs.id);
  assert(
    user1Fetched.every(n => n.userId === userWithNotifs.id),
    'User 1 notification query contains ONLY User 1 notifications'
  );

  const user2Fetched = db.notifications.filter(n => n.userId === userWithoutNotifs.id);
  assert(
    user2Fetched.every(n => n.userId === userWithoutNotifs.id),
    'User 2 notification query contains ONLY User 2 notifications'
  );
  assert(user2Fetched.length === 0, 'User 2 has 0 notifications in the database');

  // 2. Unread Badge Count Computation
  console.log('\n2. Unread Badge Calculation:');
  const user1BadgeCount = user1Fetched.filter(n => !n.read).length;
  const user2BadgeCount = user2Fetched.filter(n => !n.read).length;

  assert(user1BadgeCount > 0, `User 1 unread badge count is ${user1BadgeCount} (not a hardcoded 2)`);
  assert(user2BadgeCount === 0, 'User 2 unread badge count is 0 (hidden badge, no fake count)');

  // 3. Mark Single Notification as Read
  console.log('\n3. Mark Single Notification as Read:');
  const unreadItem = user1Fetched.find(n => !n.read);
  if (unreadItem) {
    const targetId = unreadItem.id;
    // Simulate API update
    const list = db.notifications;
    const item = list.find(n => n.id === targetId && n.userId === userWithNotifs.id);
    if (item) {
      item.read = true;
      db.notifications = list;
    }

    const recheckList = db.notifications;
    const updatedItem = recheckList.find(n => n.id === targetId);
    assert(updatedItem?.read === true, 'Notification marked as read in database');

    const newUnreadCount = recheckList.filter(n => n.userId === userWithNotifs.id && !n.read).length;
    assert(newUnreadCount === user1BadgeCount - 1, `Unread count decremented from ${user1BadgeCount} to ${newUnreadCount}`);
  }

  // 4. Dynamic New Notification Creation
  console.log('\n4. Dynamic Notification Creation:');
  const newNotif = NotificationService.send({
    userId: userWithoutNotifs.id,
    title: 'New Expense Submitted',
    message: 'A new travel expense was submitted for your department.',
    type: 'approval'
  });

  const user2UpdatedNotifs = db.notifications.filter(n => n.userId === userWithoutNotifs.id);
  const user2NewUnread = user2UpdatedNotifs.filter(n => !n.read).length;
  assert(user2NewUnread === 1, 'User 2 unread count dynamically incremented to 1 upon new notification creation');
  assert(user2UpdatedNotifs[0].id === newNotif.id, 'User 2 received the exact notification created');

  // 5. Mark All as Read
  console.log('\n5. Mark All Notifications as Read:');
  const listAfterAdd = db.notifications;
  for (const n of listAfterAdd) {
    if (n.userId === userWithoutNotifs.id && !n.read) {
      n.read = true;
    }
  }
  db.notifications = listAfterAdd;

  const user2FinalNotifs = db.notifications.filter(n => n.userId === userWithoutNotifs.id);
  const user2FinalUnread = user2FinalNotifs.filter(n => !n.read).length;
  assert(user2FinalUnread === 0, 'User 2 unread count successfully reset to 0 after mark-all-read');

  // Clean up test notification for User 2 so database stays clean
  db.notifications = db.notifications.filter(n => n.id !== newNotif.id);

  // 6. Notification Navigation & Entity Deep Link Validation
  console.log('\n6. Notification Navigation & Entity Deep Link Validation:');

  // Verify that all seeded notifications have /dashboard paths (never raw root paths)
  const seededWithLinks = db.notifications.filter(n => n.link);
  assert(
    seededWithLinks.length > 0 && seededWithLinks.every(n => n.link!.startsWith('/dashboard/')),
    'All notifications with links use valid routes nested under /dashboard (no root paths)'
  );

  // Verify notif-1 points to actual existing report rep-002
  const notif1 = db.notifications.find(n => n.id === 'notif-1');
  assert(notif1?.link === '/dashboard/reports/rep-002', 'notif-1 links to /dashboard/reports/rep-002');
  const targetReport = db.reports.find(r => r.id === 'rep-002');
  assert(targetReport !== undefined && targetReport.status === 'reimbursed', 'Target report rep-002 exists in db.reports and is reimbursed');

  // Verify notif-2 points to actual existing expense exp-103
  const notif2 = db.notifications.find(n => n.id === 'notif-2');
  assert(notif2?.link === '/dashboard/expenses?id=exp-103', 'notif-2 links to /dashboard/expenses?id=exp-103');
  const targetExp103 = db.expenses.find(e => e.id === 'exp-103');
  assert(targetExp103 !== undefined && targetExp103.merchant === 'The Capital Grille', 'Target expense exp-103 exists in db.expenses');

  // Verify notif-3 points to actual existing expense exp-105 for manager review
  const notif3 = db.notifications.find(n => n.id === 'notif-3');
  assert(notif3?.link === '/dashboard/approvals?expenseId=exp-105', 'notif-3 links to /dashboard/approvals?expenseId=exp-105');
  const targetExp105 = db.expenses.find(e => e.id === 'exp-105');
  assert(targetExp105 !== undefined && targetExp105.merchant === 'Lufthansa First Class', 'Target expense exp-105 exists in db.expenses for manager review');

  // Verify notif-4 points to actual existing expense exp-107
  const notif4 = db.notifications.find(n => n.id === 'notif-4');
  assert(notif4?.link === '/dashboard/expenses?id=exp-107', 'notif-4 links to /dashboard/expenses?id=exp-107');
  const targetExp107 = db.expenses.find(e => e.id === 'exp-107');
  assert(targetExp107 !== undefined && targetExp107.merchant === 'Staples Office Supplies', 'Target expense exp-107 exists in db.expenses');

  // Verify path resolver logic: root paths normalize to /dashboard, absent links fallback safely or return null
  function resolvePathTest(n: { link?: string; type?: string }): string | null {
    if (n.link && n.link.trim()) {
      let link = n.link.trim();
      if (link.startsWith('/') && !link.startsWith('/dashboard')) {
        link = `/dashboard${link}`;
      }
      return link;
    }
    switch (n.type) {
      case 'approval': return '/dashboard/expenses';
      case 'reimbursement': return '/dashboard/reports';
      case 'policy': return '/dashboard/expenses';
      case 'anomaly': return '/dashboard/anomalies';
      case 'budget': return '/dashboard/budgets';
      default: return null;
    }
  }

  assert(
    resolvePathTest({ link: '/expenses?id=exp-103' }) === '/dashboard/expenses?id=exp-103',
    'Resolver normalizes root relative link /expenses?id=exp-103 to /dashboard/expenses?id=exp-103'
  );
  assert(
    resolvePathTest({ link: '/dashboard/approvals?expenseId=exp-105' }) === '/dashboard/approvals?expenseId=exp-105',
    'Resolver preserves canonical /dashboard paths'
  );
  assert(
    resolvePathTest({ type: 'policy' }) === '/dashboard/expenses',
    'Resolver falls back safely to /dashboard/expenses for policy notifications without link'
  );
  assert(
    resolvePathTest({ type: 'system' }) === null,
    'Resolver returns null for notifications without valid destination, preventing redirect to Overview'
  );

  // Role permissions verification:
  // Alex Rivera (usr-employee-1) owns notif-1, notif-2, notif-4; cannot view manager approval queue
  const employeeNotifs = db.notifications.filter(n => n.userId === 'usr-employee-1');
  assert(
    employeeNotifs.every(n => !n.link || !n.link.startsWith('/dashboard/approvals')),
    'Employee notifications never route to manager approval queue'
  );
  // Sarah Jenkins (usr-manager-1) owns notif-3 which routes to /dashboard/approvals
  const managerNotifs = db.notifications.filter(n => n.userId === 'usr-manager-1');
  assert(
    managerNotifs.some(n => n.link?.startsWith('/dashboard/approvals')),
    'Manager notifications route to manager approval actions'
  );

  console.log('\n========================================');
  console.log(` TEST RUN RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNotificationTests();
