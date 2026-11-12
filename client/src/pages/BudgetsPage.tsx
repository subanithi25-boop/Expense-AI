import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetApi } from '../services/api';
import { DepartmentBudget } from '../types';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Building,
  Edit2,
  DollarSign,
  Calendar,
  Sparkles
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { role } = useAuth();
  const [budgets, setBudgets] = useState<DepartmentBudget[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Budget Modal
  const [editingBudget, setEditingBudget] = useState<DepartmentBudget | null>(null);
  const [newAllocation, setNewAllocation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetApi.getBudgets();
      setBudgets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleEditClick = (b: DepartmentBudget) => {
    setEditingBudget(b);
    setNewAllocation(String(b.monthlyAllocation));
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !newAllocation) return;
    setSaving(true);
    try {
      await budgetApi.updateBudget(editingBudget.id, {
        monthlyAllocation: parseFloat(newAllocation)
      });
      setEditingBudget(null);
      fetchBudgets();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const totalOrganizationBudget = budgets.reduce((sum, b) => sum + b.monthlyAllocation, 0);
  const totalOrganizationSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalOrganizationRemaining = Math.max(0, totalOrganizationBudget - totalOrganizationSpent);
  const overallUtilization = totalOrganizationBudget > 0 ? Math.round((totalOrganizationSpent / totalOrganizationBudget) * 100) : 0;

  const isFinanceOrAdmin = role === 'finance' || role === 'admin';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Corporate Budget Intelligence & Forecasts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                FY 2026 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monitor department caps, category velocity, dynamic run-rate projections, and threshold alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Top Organization Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Monthly Allocation</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${totalOrganizationBudget.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Across {budgets.length} corporate cost centers</span>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Actual Expenditure Spent</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalOrganizationSpent.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Approved & disbursed claims</span>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Remaining Runway</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${totalOrganizationRemaining.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">Available until March 31</span>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Overall Utilization</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {overallUtilization}%
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full ${overallUtilization > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${overallUtilization}%` }}
            />
          </div>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Departmental Budget Allocations</span>
          <span className="text-xs font-normal text-slate-400">Click edit to adjust monthly limits</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgets.map(b => (
            <div
              key={b.id}
              className={`p-5 rounded-xl bg-white dark:bg-[#131B2E] border transition-all ${
                b.isOverBudget
                  ? 'border-red-400 dark:border-red-800'
                  : b.isNearLimit
                  ? 'border-amber-400 dark:border-amber-800'
                  : 'border-slate-200/80 dark:border-slate-800'
              } shadow-xs space-y-4`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{b.department}</h4>
                    <span className="text-[11px] text-slate-400">Month 3 • FY 2026</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {b.isNearLimit && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Near Limit ({b.utilizationRate}%)
                    </span>
                  )}
                  {isFinanceOrAdmin && (
                    <button
                      onClick={() => handleEditClick(b)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Adjust allocation"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress & Utilization */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Utilization Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${b.spentAmount.toLocaleString()} / ${b.monthlyAllocation.toLocaleString()} ({b.utilizationRate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      b.utilizationRate >= 90
                        ? 'bg-red-500'
                        : b.utilizationRate >= 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.utilizationRate)}%` }}
                  />
                </div>
              </div>

              {/* Forecast & Pending Spend */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Run-Rate Forecast</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    ${b.projectedMonthEnd.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Projected month-end total</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Remaining Allocation</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${b.remainingAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">Uncommitted budget</div>
                </div>
              </div>

              {/* Sub-Category Allocations */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sub-Category Limits
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(b.allocatedCategories).map(([cat, limit]) => {
                    const spent = b.categorySpent?.[cat] || 0;
                    const pct = Math.min(100, Math.round((spent / limit) * 100));
                    return (
                      <div key={cat} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                        <span className="text-slate-600 dark:text-slate-400">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">${spent.toFixed(0)} / ${limit.toLocaleString()}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${pct >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-md w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Adjust {editingBudget.department} Budget
              </h3>
              <button onClick={() => setEditingBudget(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Monthly Budget Allocation ($ USD) *</label>
                <input
                  type="number"
                  required
                  value={newAllocation}
                  onChange={(e) => setNewAllocation(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {saving ? 'Updating...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
