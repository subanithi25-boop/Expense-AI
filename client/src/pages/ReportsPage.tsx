
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportApi, expenseApi } from '../services/api';
import { ExpenseReport, Expense, ReportStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Download,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const targetReportId = id || searchParams.get('reportId');

  const { currentUser, role } = useAuth();
  const [reports, setReports] = useState<ExpenseReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(null);
  const [reportExpenses, setReportExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Report Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableExpenses, setAvailableExpenses] = useState<Expense[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Reviewer Action notes
  const [reviewerNotes, setReviewerNotes] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const list = await reportApi.getReports();
      setReports(list);
      if (targetReportId) {
        const found = list.find(r => r.id === targetReportId);
        if (found) {
          loadReportDetails(found.id);
        } else if (list.length > 0 && !selectedReport) {
          loadReportDetails(list[0].id);
        }
      } else if (list.length > 0 && !selectedReport) {
        loadReportDetails(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetReportId && reports.length > 0) {
      const found = reports.find(r => r.id === targetReportId);
      if (found && selectedReport?.id !== found.id) {
        loadReportDetails(found.id);
      }
    }
  }, [targetReportId, reports]);

  const loadReportDetails = async (id: string) => {
    try {
      const data = await reportApi.getReportById(id);
      setSelectedReport(data.report);
      setReportExpenses(data.expenses);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentUser]);

  const handleOpenCreate = async () => {
    try {
      const all = await expenseApi.getExpenses();
      setAvailableExpenses(all);
      setSelectedExpenseIds(all.filter(e => !e.reportId).map(e => e.id));

      // Keep all three fields empty for manual user entry
      setTitle('');
      setStartDate('');
      setEndDate('');

      setShowCreateModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !startDate || !endDate) {
      alert('Please enter the report title, start date and end date.');
      return;
    }

    if (endDate < startDate) {
      alert('Period End cannot be earlier than Period Start.');
      return;
    }

    if (selectedExpenseIds.length === 0) {
      alert('Please select at least one expense.');
      return;
    }

    setCreating(true);
    try {
      const newRep = await reportApi.createReport({
        title: title.trim(),
        startDate,
        endDate,
        expenseIds: selectedExpenseIds
      });
      setShowCreateModal(false);
      fetchReports();
      loadReportDetails(newRep.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitReport = async (id: string) => {
    try {
      const updated = await reportApi.submitReport(id);
      setSelectedReport(updated);
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransitionStatus = async (id: string, newStatus: ReportStatus) => {
    try {
      const updated = await reportApi.transitionReport(id, newStatus, reviewerNotes);
      setSelectedReport(updated);
      fetchReports();
      setReviewerNotes('');
      if (newStatus === 'reimbursed') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export report to CSV
  const handleExportCSV = () => {
    if (!selectedReport) return;
    const headers = ['Transaction ID', 'Merchant', 'Date', 'Category', 'Amount (USD)', 'Compliance', 'Status', 'Description'];
    const rows = reportExpenses.map(e => [
      e.id,
      `"${e.merchant}"`,
      e.date,
      `"${e.category}"`,
      e.convertedAmount || e.amount,
      e.complianceStatus,
      e.status,
      `"${e.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReport.reportNumber}_SpendWise_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export report to real PDF
  const handleExportPDF = () => {
    if (!selectedReport) return;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(16, 24, 40);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('SpendWise AI - Expense Reimbursement Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text(`Official Audited Record • ${selectedReport.reportNumber}`, 14, 28);

    // Meta details
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.text(`Employee Name: ${selectedReport.userName}`, 14, 45);
    doc.text(`Department: ${selectedReport.userDepartment}`, 14, 52);
    doc.text(`Date Range: ${selectedReport.startDate} to ${selectedReport.endDate}`, 14, 59);

    doc.text(`Status: ${selectedReport.status.toUpperCase()}`, 130, 45);
    doc.text(`Total Amount: $${selectedReport.totalAmount.toFixed(2)} USD`, 130, 52);
    doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 130, 59);

    // Table of expenses
    const tableData = reportExpenses.map((e, index) => [
      index + 1,
      e.merchant,
      e.date,
      e.category,
      e.complianceStatus.toUpperCase(),
      `$${(e.convertedAmount || e.amount).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['#', 'Merchant / Vendor', 'Date', 'Category', 'Policy', 'Amount']],
      body: tableData,
      headStyles: { fillColor: [16, 24, 40] },
      alternateRowStyles: { fillColor: [243, 246, 250] }
    });

    // Summary footer
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.setTextColor(16, 24, 40);
    doc.text(`Audited Net Total: $${selectedReport.totalAmount.toFixed(2)} USD`, 130, finalY);

    doc.save(`${selectedReport.reportNumber}_Report.pdf`);
  };

  const pipelineStages: ReportStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'approved',
    'reimbursement_pending',
    'reimbursed'
  ];

  const getStageIndex = (st: ReportStatus) => {
    return pipelineStages.indexOf(st);
  };

  const isFinance = role === 'finance' || role === 'admin';
  const isManager = role === 'manager' || role === 'admin';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Expense Reports & Reimbursement Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Audit-Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Group transactions into periodic expense claims, track multi-level approvals, and disburse reimbursements.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
        >
          <Plus className="w-4 h-4" /> Create Expense Report
        </button>
      </div>

      {/* Main Split: Reports List (Left) & Active Report Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Report Cards List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            All Expense Reports ({reports.length})
          </h3>

          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto">
            {reports.map((r) => {
              const isSelected = selectedReport?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => loadReportDetails(r.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#131B2E] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                      {r.reportNumber}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {r.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-400">{r.expenseIds.length} transactions</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ${r.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Full Report Detail, Progress Tracker & PDF/CSV Export */}
        <div className="lg:col-span-8 space-y-5">
          {selectedReport ? (
            <div className="bg-white dark:bg-[#131B2E] rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {selectedReport.reportNumber}
                    </span>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedReport.title}
                  </h2>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Submitted by {selectedReport.userName}</span>
                    <span>•</span>
                    <span>{selectedReport.userDepartment}</span>
                    <span>•</span>
                    <span>{selectedReport.startDate} to {selectedReport.endDate}</span>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    title="Export as CSV"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    title="Generate PDF Report"
                  >
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Report Lifecycle Pipeline
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {pipelineStages.map((st, idx) => {
                    const currentIdx = getStageIndex(selectedReport.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = selectedReport.status === st;

                    return (
                      <div key={st} className="flex flex-col items-center text-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                              : isPassed
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[10px] font-semibold mt-1.5 capitalize ${isCurrent ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                          {st.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions in Report */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Attached Expense Transactions ({reportExpenses.length})
                  </h3>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Total: ${selectedReport.totalAmount.toFixed(2)} USD
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Merchant</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportExpenses.map(e => (
                        <tr key={e.id}>
                          <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{e.merchant}</td>
                          <td className="px-4 py-2.5 text-slate-500">{e.date}</td>
                          <td className="px-4 py-2.5">{e.category}</td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                            ${(e.convertedAmount || e.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Toolbar by Role */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {selectedReport.reviewerNotes && (
                    <span>Notes: "{selectedReport.reviewerNotes}"</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedReport.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitReport(selectedReport.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit for Review
                    </button>
                  )}

                  {isManager && (selectedReport.status === 'submitted' || selectedReport.status === 'under_review') && (
                    <>
                      <button
                        onClick={() => handleTransitionStatus(selectedReport.id, 'approved')}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                      >
                        Approve Report
                      </button>
                      <button
                        onClick={() => handleTransitionStatus(selectedReport.id, 'changes_requested')}
                        className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200"
                      >
                        Request Changes
                      </button>
                    </>
                  )}

                  {isFinance && (selectedReport.status === 'approved' || selectedReport.status === 'reimbursement_pending') && (
                    <button
                      onClick={() => handleTransitionStatus(selectedReport.id, 'reimbursed')}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                    >
                      <DollarSign className="w-4 h-4" /> Disburse Reimbursement ($ {selectedReport.totalAmount.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#131B2E] rounded-xl p-12 text-center text-slate-400 border border-slate-200/80 dark:border-slate-800">
              Select or create an expense report to review details.
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Generate Expense Report
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your report title"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Period End *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Select Expenses to Include ({selectedExpenseIds.length} chosen)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {availableExpenses.map(e => (
                    <label key={e.id} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedExpenseIds.includes(e.id)}
                          onChange={() => {
                            setSelectedExpenseIds(prev =>
                              prev.includes(e.id) ? prev.filter(i => i !== e.id) : [...prev, e.id]
                            );
                          }}
                          className="rounded text-emerald-600"
                        />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{e.merchant}</div>
                          <div className="text-[10px] text-slate-400">{e.date} • {e.category}</div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">${e.amount.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || selectedExpenseIds.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  {creating ? 'Creating...' : 'Create Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
