import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../services/api';
import { Expense, DashboardMetrics } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { PolicyBadge } from '../components/common/PolicyBadge';
import { AnomalyBadge } from '../components/common/AnomalyBadge';
import { AIInsightsPanel } from '../components/dashboard/AIInsightsPanel';
import { PolicyCheckQuickModal } from '../components/dashboard/PolicyCheckQuickModal';
import { ExpenseDetailModal } from '../components/expenses/ExpenseDetailModal';
import { ManualExpenseModal } from '../components/expenses/ManualExpenseModal';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Clock,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  ScanLine,
  ShieldAlert,
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState('This Month (March 2026)');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalExpenses: 22450.0,
    pendingReimbursements: 3412.5,
    approvedPayments: 18450.0,
    remainingBudget: 36800.0,
    policyComplianceRate: 94,
    unusualTransactionsCount: 2
  });

  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [departmentSpending, setDepartmentSpending] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Expense[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Expense[]>([]);

  // Modals
  const [showPolicyCheck, setShowPolicyCheck] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.getDashboardSummary();
      setMetrics(data.metrics);
      setMonthlyTrend(data.monthlyTrend);
      setCategoryDistribution(data.categoryDistribution);
      setDepartmentSpending(data.departmentSpending);
      setAiInsights(data.aiInsights);
      setRecentTransactions(data.recentTransactions);
      setPendingApprovals(data.pendingApprovals);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  // Donut chart colors (Tailwind emerald, navy, teal, violet, amber, indigo, sky)
  const DONUT_COLORS = ['#10B981', '#1E293B', '#06B6D4', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899', '#64748B'];

  return (
    <div className="space-y-6">
      {/* 1. Personalized Welcome & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'Alex'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Financial Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            SpendWise AI is actively monitoring enterprise expenses, automated OCR extractions, and compliance flags.
          </p>
        </div>

        {/* Date Filter & Fast Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="This Month (March 2026)">This Month (March 2026)</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
              <option value="Fiscal Year 2026">Fiscal Year 2026</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/dashboard/scan')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-700/20 transition-all hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4" /> Scan Receipt
          </button>
        </div>
      </div>

      {/* 2. Five Financial Summary Cards (Section 5 requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Expenses"
          value={`$${metrics.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Current calendar month"
          icon={Wallet}
          variant="emerald"
          trend={{ value: '+4.2%', isPositive: true, label: 'vs last mo' }}
        />

        <MetricCard
          title="Pending Reimbursements"
          value={`$${metrics.pendingReimbursements.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Awaiting manager approval"
          icon={Clock}
          variant="amber"
          trend={{ value: '3 claims', isPositive: false }}
        />

        <MetricCard
          title="Approved Payments"
          value={`$${metrics.approvedPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Cleared for disbursement"
          icon={CheckCircle2}
          variant="blue"
          trend={{ value: '18 claims', isPositive: true }}
        />

        <MetricCard
          title="Remaining Budget"
          value={`$${metrics.remainingBudget.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle={`${currentUser?.department || 'Engineering'} monthly cap`}
          icon={PieChart}
          variant="navy"
          trend={{ value: '81% left', isPositive: true }}
        />

        <MetricCard
          title="Policy Compliance"
          value={`${metrics.policyComplianceRate}%`}
          subtitle={`${metrics.unusualTransactionsCount} anomalous items`}
          icon={ShieldCheck}
          variant={metrics.policyComplianceRate >= 90 ? 'emerald' : 'amber'}
          trend={{ value: '+2.1%', isPositive: true }}
        />
      </div>

      {/* 3. Analytics Row: Monthly Spend Line Chart, Category Donut, Dept Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending Trend Area Chart */}
        <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Spending Trend</h3>
              <p className="text-[11px] text-slate-500">Expenditure trajectory vs monthly budget ceiling</p>
            </div>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Spend']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#spendColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Donut */}
        <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expense Distribution</h3>
              <p className="text-[11px] text-slate-500">Breakdown by corporate spending category</p>
            </div>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <PieChart className="w-4 h-4" />
            </span>
          </div>

          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: '#1E293B',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#1E293B', fontWeight: 700 }}
                  labelStyle={{ color: '#1E293B', fontWeight: 700, marginBottom: '4px' }}
                  cursor={false}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Mini Category Legend */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryDistribution.slice(0, 8).map((c, i) => (
              <div key={c.name} className="flex min-w-0 items-center justify-between gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                  />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                  {c.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Spending Comparison Bar Chart */}
        <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Budgets</h3>
              <p className="text-[11px] text-slate-500">Actual spend vs monthly allocation limit</p>
            </div>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="department" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="spent" name="Spent" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budget" name="Budget" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Main Tables & AI Insights Split Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions & Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions Table */}
          <div className="bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                <p className="text-[11px] text-slate-500">Live feed of processed receipts and submitted claims</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/expenses')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View all expenses <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Merchant / Vendor</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold text-center">Compliance</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedExpense(tx)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{tx.merchant}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{tx.description || tx.userDepartment}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        ${tx.amount.toFixed(2)}
                        {tx.currency !== 'USD' && (
                          <div className="text-[10px] text-slate-400 font-normal">({tx.currency})</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <PolicyBadge status={tx.complianceStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Approvals Table (for managers/finance or preview) */}
          <div className="bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Approval Queue</h3>
                  <p className="text-[11px] text-slate-500">Expenses awaiting managerial authorization</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/approvals')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Go to Approvals <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Merchant</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold text-center">Risk Score</th>
                    <th className="px-5 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingApprovals.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedExpense(app)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                        {app.userName}
                        <div className="text-[10px] text-slate-400">{app.userDepartment}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">{app.merchant}</td>
                      <td className="px-5 py-3">{app.category}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">
                        ${app.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <AnomalyBadge anomaly={app.anomaly} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpense(app);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Explainable AI Spending Insights & Activity */}
        <div className="space-y-6">
          <AIInsightsPanel insights={aiInsights} />
        </div>
      </div>

      {/* 5. Bottom Action Area (Prominent scan, travel policy check, report actions) */}
      <div className="p-6 bg-gradient-to-r from-[#101828] via-[#162032] to-[#101828] text-white rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Spend Smarter. Stay Compliant. Reimburse Faster.
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automate receipts with neural OCR, test travel allowances in advance, or export an audited expense report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/scan')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 transition-all hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4" /> Scan Receipt
          </button>

          <button
            onClick={() => setShowPolicyCheck(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Travel Policy Check
          </button>

          <button
            onClick={() => navigate('/dashboard/reports')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Generate Report
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Manual Entry
          </button>
        </div>
      </div>

      {/* Interactive Modals */}
      <PolicyCheckQuickModal
        isOpen={showPolicyCheck}
        onClose={() => setShowPolicyCheck(false)}
      />

      <ManualExpenseModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={fetchDashboardData}
      />

      <ExpenseDetailModal
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onUpdated={fetchDashboardData}
      />
    </div>
  );
};
