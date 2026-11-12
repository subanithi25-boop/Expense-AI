import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseApi } from '../services/api';
import { Expense } from '../types';
import { AnomalyBadge } from '../components/common/AnomalyBadge';
import { PolicyBadge } from '../components/common/PolicyBadge';
import { ExpenseDetailModal } from '../components/expenses/ExpenseDetailModal';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  CheckSquare,
  XCircle,
  AlertOctagon,
  Eye,
  Info,
  Sparkles
} from 'lucide-react';

export const AnomalyReviewPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { role, currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const targetId = searchParams.get('expenseId') || searchParams.get('id');
    if (targetId && expenses.length > 0) {
      const match = expenses.find(e => e.id === targetId);
      if (match) setSelectedExpense(match);
    }
  }, [searchParams, expenses]);

  // Resolution modal state
  const [resolvingExpense, setResolvingExpense] = useState<Expense | null>(null);
  const [resolution, setResolution] = useState<'legitimate' | 'rejected'>('legitimate');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const all = await expenseApi.getExpenses();
      // Filter expenses with medium or high risk score, or flagged
      const flagged = all.filter(e => e.anomaly.riskScore >= 25 || e.anomaly.investigationStatus !== 'not_flagged');
      setExpenses(flagged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentUser]);

  const handleOpenResolve = (e: Expense, res: 'legitimate' | 'rejected') => {
    setResolvingExpense(e);
    setResolution(res);
    setReviewerNotes(res === 'legitimate' ? 'Verified legitimate business justification.' : 'Flagged for audit / claim denied.');
  };

  const handleConfirmResolve = async () => {
    if (!resolvingExpense) return;
    setSavingResolution(true);
    try {
      await expenseApi.resolveAnomaly(resolvingExpense.id, resolution, reviewerNotes);
      setResolvingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingResolution(false);
    }
  };

  const highCount = expenses.filter(e => e.anomaly.riskLevel === 'High').length;
  const medCount = expenses.filter(e => e.anomaly.riskLevel === 'Medium').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Explainable Anomaly & Fraud Detection Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
                {highCount} High Priority
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Neural statistical outlier monitoring, duplicate receipt prevention, and auditable investigator sign-offs.
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines Notice Card (Section 6.F critical requirement) */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Investigator Standard Operating Procedure:</span> SpendWise AI anomaly risk scores serve as review signals, not proof of misconduct. Please examine the business context, attendee justifications, and merchant invoices before determining a final resolution.
        </div>
      </div>

      {/* Anomaly Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">High Risk Alerts</span>
            <div className="text-2xl font-black text-red-600 mt-1">{highCount}</div>
            <span className="text-[11px] text-slate-400">Risk Score &gt;= 70%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Medium Risk Alerts</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{medCount}</div>
            <span className="text-[11px] text-slate-400">Risk Score 35% - 69%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Monitored Transactions</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{expenses.length}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Flagged for inspection</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Anomaly Inspection Feed */}
      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
            No anomalous transactions flagged across your organization.
          </div>
        ) : (
          expenses.map(e => (
            <div
              key={e.id}
              className={`p-5 rounded-xl bg-white dark:bg-[#131B2E] border ${
                e.anomaly.riskLevel === 'High'
                  ? 'border-red-300 dark:border-red-800/80'
                  : 'border-amber-300 dark:border-amber-800/80'
              } shadow-xs space-y-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    e.anomaly.riskLevel === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-950/60' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'
                  }`}>
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{e.merchant}</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ${e.amount.toFixed(2)} {e.currency}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Submitted by {e.userName} ({e.userDepartment}) on {e.date} • Category: {e.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AnomalyBadge anomaly={e.anomaly} showScore />
                  <PolicyBadge status={e.complianceStatus} />
                </div>
              </div>

              {/* Explainable Reasons */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Explainable Risk Factors Detected:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                  {e.anomaly.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                {e.anomaly.reviewerNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-medium">
                    Prior Resolution Note: "{e.anomaly.reviewerNotes}"
                  </div>
                )}
              </div>

              {/* Investigator Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-400 capitalize">
                  Status: <strong className="text-slate-700 dark:text-slate-300">{e.anomaly.investigationStatus.replace('_', ' ')}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedExpense(e)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Inspect Full Transaction
                  </button>

                  <button
                    onClick={() => handleOpenResolve(e, 'legitimate')}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Legitimate
                  </button>

                  <button
                    onClick={() => handleOpenResolve(e, 'rejected')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 border border-red-200 dark:border-red-800"
                  >
                    Flag / Reject Claim
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {resolvingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Resolve Anomaly: {resolvingExpense.merchant}
            </h3>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              Provide an auditable explanation for marking this transaction as{' '}
              <strong>{resolution === 'legitimate' ? 'Legitimate' : 'Rejected'}</strong>:
            </div>

            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingExpense(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={savingResolution || !reviewerNotes.trim()}
                onClick={handleConfirmResolve}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl"
              >
                {savingResolution ? 'Submitting...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onUpdated={fetchExpenses}
      />
    </div>
  );
};
