import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseApi, reportApi } from '../services/api';
import { Expense, ExpenseCategory } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PolicyBadge } from '../components/common/PolicyBadge';
import { AnomalyBadge } from '../components/common/AnomalyBadge';
import { ExpenseDetailModal } from '../components/expenses/ExpenseDetailModal';
import { SplitExpenseModal } from '../components/expenses/SplitExpenseModal';
import { ManualExpenseModal } from '../components/expenses/ManualExpenseModal';
import { ReceiptViewerModal } from '../components/expenses/ReceiptViewerModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ScanLine,
  FileSpreadsheet,
  Receipt,
  Layers,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [compliance, setCompliance] = useState('All');

  // Selection for bulk report generation
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [splitExpense, setSplitExpense] = useState<Expense | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [viewReceiptExpense, setViewReceiptExpense] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseApi.getExpenses({
        category: category !== 'All' ? category : undefined,
        status: status !== 'All' ? status : undefined,
        compliance: compliance !== 'All' ? compliance : undefined,
        search: search.trim() || undefined
      });
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [category, status, compliance, currentUser]);

  useEffect(() => {
    const targetId = searchParams.get('id') || searchParams.get('expenseId');
    if (targetId && expenses.length > 0) {
      const match = expenses.find(e => e.id === targetId);
      if (match) {
        setDetailExpense(match);
      }
    }
  }, [searchParams, expenses]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === expenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expenses.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expenseApi.deleteExpense(id);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReportFromSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      const now = new Date();
      const report = await reportApi.createReport({
        title: `Expense Claim - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        expenseIds: selectedIds
      });
      navigate(`/reports/${report.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const categories: ExpenseCategory[] = [
    'Travel',
    'Accommodation',
    'Meals & Entertainment',
    'Office Supplies',
    'Software & Subscriptions',
    'Transportation',
    'Client Meetings',
    'Training & Education',
    'Utilities',
    'Groceries & Supplies',
    'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Expense Transactions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {expenses.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, split, and submit audited expense claims.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleCreateReportFromSelected}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 text-white hover:bg-slate-700 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Generate Report ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </button>

          <button
            onClick={() => navigate('/dashboard/scan')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
          >
            <ScanLine className="w-4 h-4" /> Scan Receipt
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by merchant or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </form>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="reimbursed">Reimbursed</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Compliance Dropdown */}
          <div>
            <select
              value={compliance}
              onChange={(e) => setCompliance(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="All">All Compliance</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Policy Warning</option>
              <option value="violation">Policy Violation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleSelectAll} className="p-0.5 hover:text-slate-800 dark:hover:text-white">
                    {selectedIds.length === expenses.length && expenses.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Merchant / Details</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold text-center">Receipt</th>
                <th className="px-4 py-3 font-semibold text-center">Compliance</th>
                <th className="px-4 py-3 font-semibold text-center">Risk</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No expenses matched the selected criteria.
                  </td>
                </tr>
              ) : (
                expenses.map(e => {
                  const isSelected = selectedIds.includes(e.id);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setDetailExpense(e)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(e.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {e.merchant}
                          {e.splits && e.splits.length > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold flex items-center gap-0.5">
                              <Layers className="w-2.5 h-2.5" /> Split
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {e.description || e.userDepartment}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {e.date}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {e.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        ${e.amount.toFixed(2)}
                        {e.currency !== 'USD' && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            (${e.convertedAmount.toFixed(2)} USD)
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center" onClick={(ev) => ev.stopPropagation()}>
                        {e.receiptUrl ? (
                          <button
                            onClick={() => setViewReceiptExpense(e)}
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                            title="Inspect Receipt"
                          >
                            <img
                              src={e.receiptUrl}
                              alt="thumb"
                              className="w-7 h-7 object-cover rounded border border-slate-200 dark:border-slate-700"
                            />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <PolicyBadge status={e.complianceStatus} />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <AnomalyBadge anomaly={e.anomaly} />
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={e.status} />
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(ev) => ev.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailExpense(e)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {e.status === 'pending' && (
                            <button
                              onClick={() => setSplitExpense(e)}
                              className="p-1.5 text-purple-500 hover:text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40"
                              title="Split Expense"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                          )}
                          {(e.status === 'pending' || e.status === 'draft') && (
                            <button
                              onClick={(ev) => handleDelete(e.id, ev)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ExpenseDetailModal
        expense={detailExpense}
        isOpen={!!detailExpense}
        onClose={() => setDetailExpense(null)}
        onUpdated={fetchExpenses}
        onOpenSplit={(exp) => setSplitExpense(exp)}
      />

      <SplitExpenseModal
        expense={splitExpense}
        isOpen={!!splitExpense}
        onClose={() => setSplitExpense(null)}
        onSuccess={fetchExpenses}
      />

      <ManualExpenseModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={fetchExpenses}
      />

      <ReceiptViewerModal
        isOpen={!!viewReceiptExpense}
        onClose={() => setViewReceiptExpense(null)}
        imageUrl={viewReceiptExpense?.receiptUrl}
        merchant={viewReceiptExpense?.merchant}
        ocrConfidence={viewReceiptExpense?.ocrConfidence}
      />
    </div>
  );
};
