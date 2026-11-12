import React, { useState } from 'react';
import { Expense } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PolicyBadge } from '../common/PolicyBadge';
import { AnomalyBadge } from '../common/AnomalyBadge';
import { ReceiptViewerModal } from './ReceiptViewerModal';
import { useAuth } from '../../context/AuthContext';
import { approvalApi } from '../../services/api';
import {
  X,
  Calendar,
  Building,
  CreditCard,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Layers,
  MapPin,
  CheckCircle,
  XCircle,
  AlertOctagon
} from 'lucide-react';

interface Props {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onOpenSplit?: (expense: Expense) => void;
}

export const ExpenseDetailModal: React.FC<Props> = ({
  expense,
  isOpen,
  onClose,
  onUpdated,
  onOpenSplit
}) => {
  const { role } = useAuth();
  const [showReceipt, setShowReceipt] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [comments, setComments] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  if (!isOpen || !expense) return null;

  const handleDecision = async (decision: 'approve' | 'reject' | 'changes_requested') => {
    setDeciding(true);
    try {
      await approvalApi.decideExpense(
        expense.id,
        decision,
        comments,
        decision === 'approve' && showOverrideInput ? overrideReason : undefined
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeciding(false);
    }
  };

  const isManagerOrFinance = role === 'manager' || role === 'finance' || role === 'admin';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {expense.merchant}
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Filed by {expense.userName}</span>
                  <span>•</span>
                  <span>{expense.userDepartment}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={expense.status} />
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-xs font-semibold text-slate-400 uppercase">Transaction Amount</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ${expense.amount.toFixed(2)} <span className="text-xs font-semibold text-slate-400">{expense.currency}</span>
                </div>
                {expense.currency !== 'USD' && expense.convertedAmount && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    Converted: ${expense.convertedAmount.toFixed(2)} USD
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-xs font-semibold text-slate-400 uppercase">Category</div>
                <div className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {expense.category}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Method: {expense.paymentMethod}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-xs font-semibold text-slate-400 uppercase">Compliance & Risk</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <PolicyBadge status={expense.complianceStatus} />
                  <AnomalyBadge anomaly={expense.anomaly} />
                </div>
              </div>
            </div>

            {/* AI Categorization Explanation */}
            {expense.categoryReasoning && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                <span className="font-bold">Smart Categorization Rationale:</span> {expense.categoryReasoning}
              </div>
            )}

            {/* Description & Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Purpose</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {expense.description || 'No description provided.'}
              </p>
            </div>

            {/* Mileage Claim Details (if applicable) */}
            {expense.isMileage && expense.mileageDetails && (
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Mileage Claim Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Route:</span> {expense.mileageDetails.origin} → {expense.mileageDetails.destination}
                  </div>
                  <div>
                    <span className="text-slate-400">Distance:</span> {expense.mileageDetails.distanceMiles} miles (@ ${expense.mileageDetails.ratePerMile}/mi)
                  </div>
                </div>
              </div>
            )}

            {/* Split Allocations (if applicable) */}
            {expense.splits && expense.splits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-500" /> Split Allocations Across Cost Centers
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Project</th>
                        <th className="px-3 py-2 text-right">Percentage</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {expense.splits.map((s, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium">{s.department}</td>
                          <td className="px-3 py-2">{s.category}</td>
                          <td className="px-3 py-2 text-slate-400">{s.project || 'General'}</td>
                          <td className="px-3 py-2 text-right">{s.percentage}%</td>
                          <td className="px-3 py-2 text-right font-bold">${s.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Policy Verification Engine Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Corporate Policy Verification Checks
              </h4>
              <div className="space-y-2">
                {expense.policyChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-start justify-between ${
                      check.status === 'violation'
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                        : check.status === 'warning'
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {check.status === 'violation' ? (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        ) : check.status === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span>{check.ruleName}</span>
                      </div>
                      <p className="mt-1 opacity-90">{check.message}</p>
                    </div>
                    {check.threshold && (
                      <div className="text-right shrink-0 ml-3 text-[11px] opacity-75">
                        <div>Limit: {check.threshold}</div>
                        <div>Actual: {check.actual}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explainable Anomaly Detection Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-500" /> Anomaly & Fraud Assessment
              </h4>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Calculated Anomaly Risk Score</span>
                  <span className="font-extrabold text-sm">{expense.anomaly.riskScore} / 100 ({expense.anomaly.riskLevel} Risk)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      expense.anomaly.riskLevel === 'High'
                        ? 'bg-red-500'
                        : expense.anomaly.riskLevel === 'Medium'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${expense.anomaly.riskScore}%` }}
                  />
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mt-2 list-disc pl-4">
                  {expense.anomaly.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Receipt Preview Trigger */}
            {expense.receiptUrl && (
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <img
                    src={expense.receiptUrl}
                    alt="Receipt Thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Attached Receipt Document</div>
                    <div className="text-[11px] text-slate-500">OCR Confidence: {expense.ocrConfidence || 96}%</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceipt(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                  Inspect Full Receipt
                </button>
              </div>
            )}

            {/* Manager Review / Decision Box if pending */}
            {isManagerOrFinance && expense.status === 'pending' && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Manager & Finance Approval Action
                </h4>

                <input
                  type="text"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Review comments or justification notes (optional)..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />

                {expense.complianceStatus === 'violation' && (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                      <input
                        type="checkbox"
                        checked={showOverrideInput}
                        onChange={(e) => setShowOverrideInput(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      Authorize Policy Exception Override (Auditable)
                    </label>
                    {showOverrideInput && (
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Mandatory business reason for overriding policy violation..."
                        className="w-full text-xs p-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={deciding || (expense.complianceStatus === 'violation' && !showOverrideInput)}
                    onClick={() => handleDecision('approve')}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Expense
                  </button>
                  <button
                    disabled={deciding}
                    onClick={() => handleDecision('reject')}
                    className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    disabled={deciding}
                    onClick={() => handleDecision('changes_requested')}
                    className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg"
                  >
                    Request Changes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center text-xs">
            {onOpenSplit && expense.status === 'pending' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSplit(expense);
                }}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" /> Split Across Departments
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Receipt Viewer */}
      <ReceiptViewerModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        imageUrl={expense.receiptUrl}
        merchant={expense.merchant}
        ocrConfidence={expense.ocrConfidence}
      />
    </>
  );
};
