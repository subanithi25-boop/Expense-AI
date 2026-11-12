import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  FileSpreadsheet,
  CheckSquare,
  PieChart,
  Navigation,
  ShieldAlert,
  Blocks,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  pendingApprovalsCount?: number;
  unreadNotificationsCount?: number;
  highRiskCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingApprovalsCount = 0,
  unreadNotificationsCount,
  highRiskCount = 0
}) => {
  const { role, currentUser } = useAuth();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);

  const effectiveNotificationCount =
    unreadNotificationsCount !== undefined ? unreadNotificationsCount : unreadCount;

  // Navigation Items according to Section 7 & Role visibility
  const navItems = [
    {
      to: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/expenses',
      label: 'My Expenses',
      icon: Receipt,
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/scan',
      label: 'Scan Receipt',
      icon: ScanLine,
      badge: 'AI',
      badgeColor: 'bg-emerald-500 text-white',
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/reports',
      label: 'Expense Reports',
      icon: FileSpreadsheet,
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/approvals',
      label: 'Approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
      badgeColor: 'bg-amber-500 text-white',
      roles: ['manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/budgets',
      label: 'Budgets & Insights',
      icon: PieChart,
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/mileage',
      label: 'Mileage Claims',
      icon: Navigation,
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/anomalies',
      label: 'Anomaly Review',
      icon: ShieldAlert,
      badge: highRiskCount > 0 ? String(highRiskCount) : undefined,
      badgeColor: 'bg-red-500 text-white',
      roles: ['manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/integrations',
      label: 'Integrations',
      icon: Blocks,
      roles: ['finance', 'admin']
    },
    {
      to: '/dashboard/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: effectiveNotificationCount > 0 ? String(effectiveNotificationCount) : undefined,
      badgeColor: 'bg-emerald-500 text-white',
      roles: ['employee', 'manager', 'finance', 'admin']
    },
    {
      to: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
      roles: ['employee', 'manager', 'finance', 'admin']
    }
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <aside
      className={`relative flex flex-col h-screen bg-[#101828] text-slate-300 transition-all duration-300 z-30 shrink-0 border-r border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                SpendWise <span className="text-emerald-400 font-extrabold text-xs px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Enterprise Suite</div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
            <Sparkles className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Pill Indicator */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Active Workspace</span>
          <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            {role} Portal
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNav.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Card at Bottom */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0d1422]">
        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full object-cover border border-emerald-500/40"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name || 'Alex Rivera'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentUser?.jobTitle || 'Engineering'}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
