import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { approvalApi } from '../services/api';
import { Expense, ExpenseReport } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PolicyBadge } from '../components/common/PolicyBadge';
import { AnomalyBadge } from '../components/common/AnomalyBadge';
import { ExpenseDetailModal } from '../components/expenses/ExpenseDetailModal';
import { ReportReviewModal } from '../components/reports/ReportReviewModal';
import confetti from 'canvas-confetti';
import { useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertOctagon,
  ShieldAlert,
  Layers,
  FileSpreadsheet,
  Square,
  Eye,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { role, currentUser } = useAuth();
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [pendingReports, setPendingReports] = useState<ExpenseReport[]>([]);
  const [counts, setCounts] = useState({ expenses: 0, reports: 0, highRiskCount: 0, violationsCount: 0 });
  const [loading, setLoading] = useState(true);

  // Tab: 'expenses' | 'reports'
  const [activeTab, setActiveTab] = useState<'expenses' | 'reports'>('expenses');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(null);

  useEffect(() => {
    const expenseId = searchParams.get('expenseId') || searchParams.get('id');
    const reportId = searchParams.get('reportId');
    if (expenseId && pendingExpenses.length > 0) {
      setActiveTab('expenses');
      const match = pendingExpenses.find(e => e.id === expenseId);
      if (match) {
        setDetailExpense(match);
      }
    } else if (reportId) {
      setActiveTab('reports');
      if (pendingReports.length > 0) {
        const match = pendingReports.find(r => r.id === reportId);
        if (match) {
          setSelectedReport(match);
        }
      }
    }
  }, [searchParams, pendingExpenses, pendingReports]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await approvalApi.getPending();
      setPendingExpenses(data.pendingExpenses);
      setPendingReports(data.pendingReports);
      setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [currentUser]);

  const toggleSelect = (id: string) => {
    setSelectedExpenseIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenseIds.length === pendingExpenses.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(pendingExpenses.map(e => e.id));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedExpenseIds.length === 0) return;
    try {
      await approvalApi.batchApprove(selectedExpenseIds, 'Approved in batch by authorized manager');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      setSelectedExpenseIds([]);
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickDecide = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await approvalApi.decideExpense(id, decision, `Quick ${decision} action`);
      if (decision === 'approve') {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 }
        });
      }
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Manager & Finance Approvals Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                {counts.expenses} Pending Items
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review receipts, evaluate anomaly risk signals, verify policy compliance, and authorize disbursements.
            </p>
          </div>

          {selectedExpenseIds.length > 0 && (
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              <CheckCircle className="w-4 h-4" /> Batch Approve Selected ({selectedExpenseIds.length})
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Expenses</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{counts.expenses}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Pending Reports</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{counts.reports}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">High Risk Items</span>
            <div className="text-2xl font-bold text-red-600 mt-0.5">{counts.highRiskCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Policy Violations</span>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">{counts.violationsCount}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'expenses'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Pending Expenses ({counts.expenses})
          {activeTab === 'expenses' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs font-bold transition-all relative ml-4 ${
            activeTab === 'reports'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Pending Expense Reports ({counts.reports})
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></span>
          )}
        </button>
      </div>

      {/* Content by Tab */}
      {activeTab === 'expenses' ? (
        <div className="bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <button onClick={toggleSelectAll}>
                      {selectedExpenseIds.length === pendingExpenses.length && pendingExpenses.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Merchant / Details</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-center">Compliance</th>
                  <th className="px-4 py-3 font-semibold text-center">Risk Score</th>
                  <th className="px-4 py-3 font-semibold text-right">Review Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                      No expenses awaiting approval in your department queue!
                    </td>
                  </tr>
                ) : (
                  pendingExpenses.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => setDetailExpense(e)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedExpenseIds.includes(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          className="rounded text-emerald-600"
                        />
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                        {e.userName}
                        <div className="text-[10px] text-slate-400">{e.userDepartment}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{e.merchant}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{e.description}</div>
                      </td>

                      <td className="px-4 py-3.5">{e.category}</td>

                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                        ${e.amount.toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <PolicyBadge status={e.complianceStatus} />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <AnomalyBadge anomaly={e.anomaly} />
                      </td>

                      <td className="px-4 py-3.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailExpense(e)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleQuickDecide(e.id, 'approve')}
                            className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleQuickDecide(e.id, 'reject')}
                            className="px-2 py-1 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingReports.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200 dark:border-slate-800">
              No full reports awaiting approval.
            </div>
          ) : (
            pendingReports.map(r => (
              <div
                key={r.id}
                className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-400">{r.reportNumber}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{r.title}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Filed by {r.userName} ({r.userDepartment}) • {r.expenseIds.length} transactions
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Claim</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">${r.totalAmount.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Review Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        expense={detailExpense}
        isOpen={!!detailExpense}
        onClose={() => setDetailExpense(null)}
        onUpdated={fetchPending}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdated={fetchPending}
      />
    </div>
  );
};
