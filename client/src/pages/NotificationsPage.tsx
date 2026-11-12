import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  DollarSign,
  Info,
  CheckCheck,
  ChevronRight
} from 'lucide-react';

export function resolveNotificationPath(notification: { link?: string; type?: string }): string | null {
  if (notification.link && notification.link.trim()) {
    let link = notification.link.trim();
    // Normalize root-relative paths to the /dashboard namespace
    if (link.startsWith('/') && !link.startsWith('/dashboard')) {
      link = `/dashboard${link}`;
    }
    return link;
  }

  // Safe fallback based on notification category when link is not set
  switch (notification.type) {
    case 'approval':
      return '/dashboard/expenses';
    case 'reimbursement':
      return '/dashboard/reports';
    case 'policy':
      return '/dashboard/expenses';
    case 'anomaly':
      return '/dashboard/anomalies';
    case 'budget':
      return '/dashboard/budgets';
    default:
      return null;
  }
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filterType, setFilterType] = useState<string>('all');

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const filtered = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reimbursement':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'policy':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'anomaly':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'budget':
        return <Clock className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
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
                Activity Center & Notifications
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {unreadCount} Unread
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Live updates on receipt extraction, policy notices, manager decisions, and direct deposit reimbursements.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {['all', 'approval', 'policy', 'anomaly', 'reimbursement', 'system'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filterType === t
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No notifications found in this category.
          </div>
        ) : (
          filtered.map(n => {
            const dest = resolveNotificationPath(n);
            return (
              <div
                key={n.id}
                onClick={() => {
                  handleMarkRead(n.id);
                  if (dest) {
                    navigate(dest);
                  }
                }}
                className={`p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer flex items-start justify-between gap-3 ${
                  !n.read ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {dest && (
                  <div className="shrink-0 text-slate-400 pt-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
