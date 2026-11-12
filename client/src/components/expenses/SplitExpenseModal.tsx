import React, { useState } from 'react';
import { Expense, ExpenseCategory, SplitAllocation } from '../../types';
import { expenseApi } from '../../services/api';
import { X, Plus, Trash2, Layers, CheckCircle2 } from 'lucide-react';

interface Props {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SplitExpenseModal: React.FC<Props> = ({
  expense,
  isOpen,
  onClose,
  onSuccess
}) => {
  const totalAmount = expense?.amount || 0;
  const departments = ['Engineering', 'Product', 'Sales', 'Marketing', 'Operations', 'Finance'];
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
    'Other'
  ];

  const [splits, setSplits] = useState<SplitAllocation[]>([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (expense) {
      if (expense.splits && expense.splits.length > 0) {
        setSplits(expense.splits);
      } else {
        const half = Math.round((totalAmount / 2) * 100) / 100;
        setSplits([
          {
            department: expense.userDepartment || 'Engineering',
            category: expense.category,
            project: 'Primary Initiative',
            amount: half,
            percentage: 50
          },
          {
            department: 'Product',
            category: expense.category,
            project: 'Cross-functional Collab',
            amount: totalAmount - half,
            percentage: 50
          }
        ]);
      }
    }
  }, [expense, totalAmount]);

  if (!isOpen || !expense) return null;

  const handlePercentageChange = (index: number, pct: number) => {
    const updated = [...splits];
    updated[index].percentage = pct;
    updated[index].amount = Math.round(((pct / 100) * totalAmount) * 100) / 100;
    setSplits(updated);
  };

  const handleAmountChange = (index: number, amt: number) => {
    const updated = [...splits];
    updated[index].amount = amt;
    updated[index].percentage = Math.round(((amt / totalAmount) * 100) * 10) / 10;
    setSplits(updated);
  };

  const addSplitRow = () => {
    setSplits([
      ...splits,
      {
        department: 'Marketing',
        category: 'Office Supplies',
        project: 'General',
        amount: 0,
        percentage: 0
      }
    ]);
  };

  const removeSplitRow = (index: number) => {
    if (splits.length <= 2) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const currentTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const currentPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
  const isBalanced = Math.abs(currentTotal - totalAmount) < 0.05;

  const handleSave = async () => {
    if (!isBalanced) return;
    setSaving(true);
    try {
      await expenseApi.updateExpense(expense.id, { splits });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Split Expense Allocations
              </h3>
              <p className="text-xs text-slate-500">
                {expense.merchant} • Total: ${totalAmount.toFixed(2)} {expense.currency}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Allocate portions of this expenditure across different departments, project codes, or expense categories.
          </div>

          <div className="space-y-3">
            {splits.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Allocation #{idx + 1}</span>
                  {splits.length > 2 && (
                    <button
                      onClick={() => removeSplitRow(idx)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Department</label>
                    <select
                      value={s.department}
                      onChange={(e) => {
                        const updated = [...splits];
                        updated[idx].department = e.target.value;
                        setSplits(updated);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    >
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Category</label>
                    <select
                      value={s.category}
                      onChange={(e) => {
                        const updated = [...splits];
                        updated[idx].category = e.target.value as ExpenseCategory;
                        setSplits(updated);
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Project / Tag</label>
                    <input
                      type="text"
                      value={s.project || ''}
                      onChange={(e) => {
                        const updated = [...splits];
                        updated[idx].project = e.target.value;
                        setSplits(updated);
                      }}
                      placeholder="e.g. Q1 Sprint"
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={s.amount}
                      onChange={(e) => handleAmountChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400">Percentage (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={s.percentage}
                      onChange={(e) => handlePercentageChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addSplitRow}
            className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-50/30 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Split Allocation
          </button>
        </div>

        {/* Balancing Summary Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Allocated: ${currentTotal.toFixed(2)} of ${totalAmount.toFixed(2)} ({currentPercentage.toFixed(0)}%)
            </div>
            {!isBalanced ? (
              <div className="text-red-500 font-medium">
                Allocations must equal 100% (${(totalAmount - currentTotal).toFixed(2)} remaining)
              </div>
            ) : (
              <div className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Perfectly balanced
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={!isBalanced || saving}
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"
            >
              {saving ? 'Saving...' : 'Save Splits'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
