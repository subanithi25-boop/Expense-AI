import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpenseReport, Expense, ReportStatus } from '../../types';
import { reportApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { PolicyBadge } from '../common/PolicyBadge';
import { AnomalyBadge } from '../common/AnomalyBadge';
import { ExpenseDetailModal } from '../expenses/ExpenseDetailModal';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  User,
  Calendar,
  Layers,
  Eye,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';

interface Props {
  report: ExpenseReport | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ReportReviewModal: React.FC<Props> = ({
  report,
  isOpen,
  onClose,
  onUpdated
}) => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [reportExpenses, setReportExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inspectExpense, setInspectExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (isOpen && report) {
      setReviewerNotes(report.reviewerNotes || '');
      loadExpenses(report.id);
    } else {
      setReportExpenses([]);
      setInspectExpense(null);
    }
  }, [isOpen, report]);

  const loadExpenses = async (reportId: string) => {
    setLoadingExpenses(true);
    try {
      const data = await reportApi.getReportById(reportId);
      setReportExpenses(data.expenses || []);
    } catch (err) {
      console.error('Failed to load report expenses', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  if (!isOpen || !report) return null;

  const isManager = role === 'manager' || role === 'admin';
  const isFinance = role === 'finance' || role === 'admin';

  const pipelineStages: ReportStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'approved',
    'reimbursement_pending',
    'reimbursed'
  ];

  const currentStageIdx = pipelineStages.indexOf(report.status);

  const handleDecision = async (newStatus: ReportStatus) => {
    setSubmitting(true);
    try {
      await reportApi.transitionReport(report.id, newStatus, reviewerNotes);
      if (newStatus === 'approved' || newStatus === 'reimbursed') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to update report status', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(16, 24, 40);
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('SpendWise AI - Expense Reimbursement Report', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`Official Audited Record • ${report.reportNumber}`, 14, 28);

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(11);
      doc.text(`Employee Name: ${report.userName}`, 14, 45);
      doc.text(`Department: ${report.userDepartment}`, 14, 52);
      doc.text(`Date Range: ${report.startDate} to ${report.endDate}`, 14, 59);

      doc.text(`Status: ${report.status.toUpperCase()}`, 130, 45);
      doc.text(`Total Amount: $${(report.totalAmount ?? 0).toFixed(2)} USD`, 130, 52);
      doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 130, 59);

      const tableData = reportExpenses.map((e, index) => [
        index + 1,
        e.merchant,
        e.date,
        e.category,
        e.complianceStatus.toUpperCase(),
        `$${(e.convertedAmount ?? e.amount ?? 0).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 68,
        head: [['#', 'Merchant / Vendor', 'Date', 'Category', 'Policy', 'Amount']],
        body: tableData,
        headStyles: { fillColor: [16, 24, 40] },
        alternateRowStyles: { fillColor: [243, 246, 250] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(11);
      doc.setTextColor(16, 24, 40);
      doc.text(`Audited Net Total: $${(report.totalAmount ?? 0).toFixed(2)} USD`, 130, finalY + 15);

      doc.save(`${report.reportNumber}_Report.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Transaction ID', 'Merchant', 'Date', 'Category', 'Amount (USD)', 'Compliance', 'Status', 'Description'];
      const rows = reportExpenses.map(e => [
        e.id,
        `"${e.merchant}"`,
        e.date,
        `"${e.category}"`,
        e.convertedAmount || e.amount,
        e.complianceStatus,
        e.status,
        `"${(e.description || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${report.reportNumber}_SpendWise_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  const handleOpenFullReport = () => {
    onClose();
    navigate(`/dashboard/reports/${report.id}`);
  };

  const compliantCount = report.complianceSummary?.compliantCount ?? reportExpenses.filter(e => e.complianceStatus === 'compliant').length;
  const warningCount = report.complianceSummary?.warningCount ?? reportExpenses.filter(e => e.complianceStatus === 'warning').length;
  const violationCount = report.complianceSummary?.violationCount ?? reportExpenses.filter(e => e.complianceStatus === 'violation').length;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {report.reportNumber}
                  </span>
                  <StatusBadge status={report.status} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {report.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                title="Export PDF"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={handleOpenFullReport}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Open in full reports view"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full View
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Key Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted By</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block truncate">
                  {report.userName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  {report.userDepartment}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date Range</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block truncate">
                  {report.startDate}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                  to {report.endDate}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Claim</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  ${(report.totalAmount ?? 0).toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {report.expenseIds?.length || reportExpenses.length} transactions
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Policy Compliance</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {compliantCount} Pass
                  </span>
                  {warningCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {warningCount} Warn
                    </span>
                  )}
                  {violationCount > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                      {violationCount} Viol
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lifecycle Pipeline Progress */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Report Lifecycle Progression
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {pipelineStages.map((st, idx) => {
                  const isPassed = currentStageIdx >= idx;
                  const isCurrent = report.status === st;

                  return (
                    <div key={st} className="flex flex-col items-center text-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isCurrent
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                            : isPassed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-medium mt-1 capitalize truncate max-w-full ${isCurrent ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {st.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attached Transactions Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Attached Transactions ({reportExpenses.length})
                </h3>
                {loadingExpenses && (
                  <span className="text-xs text-slate-400 animate-pulse">Loading transaction items...</span>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Merchant / Vendor</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5 text-center">Compliance</th>
                      <th className="px-4 py-2.5 text-center">Risk</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          {loadingExpenses ? 'Loading expenses...' : 'No transactions found in this report.'}
                        </td>
                      </tr>
                    ) : (
                      reportExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-2.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{exp.merchant}</span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">{exp.description}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{exp.date}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <PolicyBadge status={exp.complianceStatus} />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {exp.anomaly ? (
                              <AnomalyBadge anomaly={exp.anomaly} />
                            ) : (
                              <span className="text-slate-400 text-xs">--</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                            ${(exp.convertedAmount ?? exp.amount ?? 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => setInspectExpense(exp)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              title="Inspect Item"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reviewer Notes Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reviewer & Audit Notes:
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Enter audit notes, verification comments, or feedback for the employee..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Modal Footer / Action Toolbar */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {report.reviewerNotes && (
                <span className="italic">Previous notes: "{report.reviewerNotes}"</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>

              {/* Manager Actions */}
              {isManager && (report.status === 'submitted' || report.status === 'under_review') && (
                <>
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('changes_requested')}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Request Changes
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('approved')}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Report
                  </button>
                </>
              )}

              {/* Finance Disbursement Action */}
              {isFinance && (report.status === 'approved' || report.status === 'reimbursement_pending') && (
                <button
                  disabled={submitting}
                  onClick={() => handleDecision('reimbursed')}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  <DollarSign className="w-4 h-4" /> Disburse Reimbursement (${(report.totalAmount ?? 0).toFixed(2)})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Single Expense Modal */}
      {inspectExpense && (
        <ExpenseDetailModal
          expense={inspectExpense}
          isOpen={!!inspectExpense}
          onClose={() => setInspectExpense(null)}
          onUpdated={() => {
            loadExpenses(report.id);
            if (onUpdated) onUpdated();
          }}
        />
      )}
    </>
  );
};
