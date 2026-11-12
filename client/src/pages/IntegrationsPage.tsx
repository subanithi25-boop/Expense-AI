import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { integrationApi } from '../services/api';
import { IntegrationStatus } from '../types';
import {
  Blocks,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  X
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const { role } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Configure modal
  const [activeConfig, setActiveConfig] = useState<IntegrationStatus | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const data = await integrationApi.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleOpenConfig = (item: IntegrationStatus) => {
    setActiveConfig(item);
    setIsDemoMode(item.status === 'demo_mode' || item.status === 'not_connected');
    setApiKey('');
    setClientSecret('');
    setSyncFeedback(null);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConfig) return;
    setSaving(true);
    try {
      await integrationApi.configure(activeConfig.providerKey, {
        apiKey,
        clientSecret,
        isDemoMode
      });
      setActiveConfig(null);
      fetchIntegrations();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSync = async (providerKey: string) => {
    setSyncingKey(providerKey);
    setSyncFeedback(null);
    try {
      const result = await integrationApi.sync(providerKey);
      setSyncFeedback(result.message);
      fetchIntegrations();
    } catch (err: any) {
      setSyncFeedback(err.response?.data?.error || 'Synchronization check failed');
    } finally {
      setSyncingKey(null);
    }
  };

  const handleDisconnect = async (providerKey: string) => {
    if (!window.confirm('Are you sure you want to disconnect this integration?')) return;
    try {
      await integrationApi.disconnect(providerKey);
      fetchIntegrations();
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
                Integrations & ERP Connectors
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Modular Adapters
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Connect corporate accounting ledgers, optical character recognition engines, exchange rate APIs, and travel networks.
            </p>
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Grid of 8 Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {integrations.map(item => {
          const isConnected = item.status === 'connected';
          const isDemo = item.status === 'demo_mode';

          return (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Live Connected
                    </span>
                  ) : isDemo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      <Zap className="w-3 h-3" /> Sandbox Mode
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Not Connected
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.name}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[48px]">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                {item.lastSync && (
                  <div className="text-[11px] text-slate-400">
                    Last sync: {new Date(item.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleOpenConfig(item)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Configure
                  </button>

                  {(isConnected || isDemo) && (
                    <button
                      onClick={() => handleTestSync(item.providerKey)}
                      disabled={syncingKey === item.providerKey}
                      className="py-1.5 px-3 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                      title="Test synchronization"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingKey === item.providerKey ? 'animate-spin' : ''}`} />
                      Sync
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Modal */}
      {activeConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Configure {activeConfig.name}
                </h3>
                <span className="text-xs text-slate-400">Secure credential handling and adapter status</span>
              </div>
              <button onClick={() => setActiveConfig(null)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs">
              {/* Sandbox Simulation Mode Toggle */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-blue-950 dark:text-blue-200">Enable Sandbox Simulation Mode</div>
                    <div className="text-[11px] text-blue-800 dark:text-blue-300">
                      Simulates live sync responses and webhook callbacks without requiring production cloud API keys.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDemoMode}
                    onChange={(e) => setIsDemoMode(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>
              </div>

              {!isDemoMode && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">API Key / Token</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk_live_..."
                      className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Client Secret / Realm ID</label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Enter client secret"
                      className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {activeConfig.status !== 'not_connected' ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDisconnect(activeConfig.providerKey);
                      setActiveConfig(null);
                    }}
                    className="text-red-500 hover:underline"
                  >
                    Disconnect Integration
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveConfig(null)}
                    className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
