import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  PiggyBank,
  ArrowLeftRight,
  FileBarChart2,
  Settings,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: Receipt, label: 'Expenses' },
  { icon: ScanLine, label: 'Receipts' },
  { icon: PiggyBank, label: 'Budgets' },
  { icon: ArrowLeftRight, label: 'Reimbursements' },
  { icon: FileBarChart2, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

const summaryCards = [
  { label: 'Total Expenses', value: '₹42,850', icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  { label: 'Pending Approval', value: '₹18,300', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { label: 'Monthly Budget', value: '₹1,25,600', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { label: 'Reimbursed', value: '₹57,150', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
];

const trendData = [
  { month: 'May', amount: 32000 },
  { month: 'Jun', amount: 38000 },
  { month: 'Jul', amount: 29000 },
  { month: 'Aug', amount: 45000 },
  { month: 'Sep', amount: 36000 },
  { month: 'Oct', amount: 42850 },
];

const categoryData = [
  { name: 'Travel', value: 35, color: '#10B981' },
  { name: 'Food', value: 25, color: '#3B82F6' },
  { name: 'Software', value: 20, color: '#8B5CF6' },
  { name: 'Office', value: 12, color: '#F59E0B' },
  { name: 'Other', value: 8, color: '#94A3B8' },
];

const recentExpenses = [
  { desc: 'Flight to Mumbai', category: 'Travel', amount: '₹12,400', status: 'approved' },
  { desc: 'Team Lunch', category: 'Food', amount: '₹2,850', status: 'pending' },
  { desc: 'Figma License', category: 'Software', amount: '₹8,100', status: 'approved' },
  { desc: 'Cab to Office', category: 'Travel', amount: '₹650', status: 'rejected' },
];

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/40' },
};

export const DashboardPreview: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto" id="dashboard-preview">
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="flex min-h-[420px]">
          {/* Sidebar */}
          <div className="hidden sm:flex flex-col w-[140px] bg-slate-50 dark:bg-[#0E1525] border-r border-slate-100 dark:border-slate-800 py-3 px-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 mb-4">
              <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">SW</span>
              </div>
              <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate">SpendWise</span>
            </div>

            <div className="space-y-0.5">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                      item.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Expense Overview</h3>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] text-slate-500 dark:text-slate-400">
                <Calendar className="w-2.5 h-2.5" />
                <span>This Month</span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-[#162032]"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className={`w-4 h-4 rounded-md ${card.bg} flex items-center justify-center`}>
                        <Icon className={`w-2.5 h-2.5 ${card.color}`} />
                      </div>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400 truncate">{card.label}</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-white">{card.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {/* Trend Chart */}
              <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-[#162032]">
                <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Monthly Trend</div>
                <div className="h-[80px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height={80} minWidth={0} minHeight={0}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="preview-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ fontSize: 9, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Amount']}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#10B981"
                        strokeWidth={1.5}
                        fill="url(#preview-gradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Pie */}
              <div className="p-2 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-[#162032]">
                <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-300 mb-1">By Category</div>
                <div className="flex items-center gap-2">
                  <div className="h-[80px] w-[80px] shrink-0 flex items-center justify-center">
                    <PieChart width={80} height={80}>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={35}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-1.5 text-[8px]">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-slate-600 dark:text-slate-400 truncate">{cat.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 ml-auto">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Expenses Table */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-[#162032] overflow-hidden">
              <div className="px-2 py-1.5">
                <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">Recent Expenses</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentExpenses.map((expense, i) => {
                  const st = statusConfig[expense.status];
                  const StatusIcon = st.icon;
                  return (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 text-[9px]">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-700 dark:text-slate-200 truncate">{expense.desc}</div>
                        <div className="text-slate-400 dark:text-slate-500 text-[8px]">{expense.category}</div>
                      </div>
                      <div className="text-right flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{expense.amount}</span>
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${st.bg}`}>
                          <StatusIcon className={`w-2.5 h-2.5 ${st.color}`} />
                          <span className={`capitalize text-[7px] font-medium ${st.color}`}>{expense.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
