import React from 'react';
import { ComplianceStatus } from '../../types';
import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';

interface Props {
  status: ComplianceStatus;
  showIcon?: boolean;
}

export const PolicyBadge: React.FC<Props> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'compliant':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          Compliant
        </span>
      );
    case 'warning':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          Policy Warning
        </span>
      );
    case 'violation':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
          Policy Violation
        </span>
      );
    case 'needs_review':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
          Needs Review
        </span>
      );
  }
};
