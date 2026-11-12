import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { policyApi, auditApi } from '../services/api';
import { CorporatePolicy } from '../types';
import {
  ShieldCheck,
  History,
  ToggleLeft,
  ToggleRight,
  Edit2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { role } = useAuth();
  const [policies, setPolicies] = useState<CorporatePolicy[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'policies' | 'audit'>('policies');

  // Edit policy modal
  const [editingPolicy, setEditingPolicy] = useState<CorporatePolicy | null>(null);
  const [description, setDescription] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [requireReceiptAbove, setRequireReceiptAbove] = useState('');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const fetchData = async () => {
    try {
      const polList = await policyApi.getPolicies();
      setPolicies(polList);
      if (role === 'admin' || role === 'finance' || role === 'manager') {
        const logs = await auditApi.getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const handleOpenEdit = (p: CorporatePolicy) => {
    setEditingPolicy(p);
    setDescription(p.description);
    setMaxAmount(String(p.maxDailyAmount || p.maxSingleAmount || ''));
    setRequireReceiptAbove(String(p.requireReceiptAboveAmount));
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setSavingPolicy(true);
    try {
      await policyApi.updatePolicy(editingPolicy.id, {
        description,
        requireReceiptAboveAmount: parseFloat(requireReceiptAbove) || 0,
        maxDailyAmount: editingPolicy.maxDailyAmount !== undefined ? parseFloat(maxAmount) : undefined,
        maxSingleAmount: editingPolicy.maxSingleAmount !== undefined ? parseFloat(maxAmount) : undefined
      });
      setEditingPolicy(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleTogglePolicy = async (p: CorporatePolicy) => {
    try {
      await policyApi.updatePolicy(p.id, { active: !p.active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Organization Settings & Governance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Corporate Policies
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure deterministic compliance rules and view system audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === 'policies'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Corporate Policies ({policies.length})
          {activeTab === 'policies' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
        </button>

        {(role === 'admin' || role === 'finance' || role === 'manager') && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ml-4 ${
              activeTab === 'audit'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" /> System Audit Trail ({auditLogs.length})
            {activeTab === 'audit' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
        )}
      </div>

      {/* Policies Tab Content */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Configurable Compliance Rules Engine
            </h3>
            <p className="text-xs text-slate-500">
              Rules evaluated synchronously during receipt scan and manual submission to flag warnings or hard violations.
            </p>

            <div className="space-y-3 pt-2">
              {policies.map(p => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {p.category}
                      </span>
                      {p.active ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Active Enforced
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{p.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span>Receipt required above: <strong>${p.requireReceiptAboveAmount}.00</strong></span>
                      {p.maxDailyAmount && <span>Max daily limit: <strong>${p.maxDailyAmount}.00</strong></span>}
                      {p.maxSingleAmount && <span>Max single transaction: <strong>${p.maxSingleAmount}.00</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleTogglePolicy(p)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title={p.active ? 'Disable policy' : 'Enable policy'}
                    >
                      {p.active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                    </button>
                    {(role === 'admin' || role === 'finance') && (
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cryptographic Audit Log (Immutable Event Stream)
            </h3>
            <p className="text-xs text-slate-500">
              Captures actor identity, role, timestamp, action type, entity ID, and change records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                      {log.actorName} <span className="text-[10px] text-slate-400 font-normal">({log.actorRole})</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 uppercase font-medium text-slate-500 text-[10px]">
                      {log.entityType} #{log.entityId.substring(0, 8)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Edit Policy: {editingPolicy.name}
            </h3>

            <form onSubmit={handleSavePolicy} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Policy Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mandatory Receipt Threshold ($ USD)</label>
                <input
                  type="number"
                  value={requireReceiptAbove}
                  onChange={(e) => setRequireReceiptAbove(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {editingPolicy.maxDailyAmount !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Daily Per-Person Cap ($ USD)</label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}

              {editingPolicy.maxSingleAmount !== undefined && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Maximum Single Transaction Cap ($ USD)</label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {savingPolicy ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
