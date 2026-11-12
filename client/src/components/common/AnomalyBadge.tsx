import React from 'react';
import { AnomalyAssessment } from '../../types';
import { Shield, AlertOctagon, Info } from 'lucide-react';

interface Props {
  anomaly: AnomalyAssessment;
  showScore?: boolean;
}

export const AnomalyBadge: React.FC<Props> = ({ anomaly, showScore = true }) => {
  if (!anomaly) return null;

  if (anomaly.riskLevel === 'High') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800">
        <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        High Risk {showScore && `(${anomaly.riskScore}%)`}
      </span>
    );
  }

  if (anomaly.riskLevel === 'Medium') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        Med Risk {showScore && `(${anomaly.riskScore}%)`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      <Shield className="w-3.5 h-3.5 text-emerald-500" />
      Low Risk {showScore && `(${anomaly.riskScore}%)`}
    </span>
  );
};
