
import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  date: string;
}

interface Props {
  insights: Insight[];
}

export const AIInsightsPanel: React.FC<Props> = ({ insights }) => {
  const navigate = useNavigate();

  const handleInspect = (item: Insight) => {
    navigate('/dashboard/anomalies', {
      state: {
        selectedInsight: item
      }
    });
  };

  return (
    <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>

          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Explainable AI Spending Insights
          </h3>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
          Live Analysis
        </span>
      </div>

      {/* Insights List */}
      <div className="space-y-3 flex-1 overflow-y-auto">

        {insights.map(item => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border text-xs transition-all duration-200 hover:shadow-xs ${
              item.type === 'warning'
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                : item.type === 'success'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200'
            }`}
          >
            <div className="flex items-start gap-2.5">

              {/* Insight Icon */}
              {item.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : item.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">

                {/* Insight Message */}
                <p className="font-medium leading-relaxed">
                  {item.message}
                </p>

                {/* Date and Inspect Button */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/60 text-[10px] opacity-75">

                  <span>
                    Generated {item.date}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleInspect(item)}
                    className="font-semibold flex items-center hover:underline cursor-pointer"
                  >
                    Inspect
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>

                </div>
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">

        <span>
          Continuous neural anomaly monitor active
        </span>

        <button
          type="button"
          onClick={() => navigate('/dashboard/anomalies')}
          className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          View All Anomalies
        </button>

      </div>
    </div>
  );
};
