import React from 'react';
import { ScanLine, Tags, ShieldCheck, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: ScanLine,
    title: 'AI Receipt Scanning',
    description:
      'Capture receipt details digitally and reduce manual data entry with receipt-processing assistance.',
  },
  {
    icon: Tags,
    title: 'Smart Expense Categorization',
    description:
      'Organize expenses into meaningful categories to make tracking and reporting easier.',
  },
  {
    icon: ShieldCheck,
    title: 'Policy Compliance',
    description:
      'Help identify expenses that may require policy review before they move through the approval workflow.',
  },
  {
    icon: TrendingUp,
    title: 'Expense Insights',
    description:
      'Understand spending patterns through clear charts, category breakdowns, and expense summaries.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-24 bg-white dark:bg-[#0B0F19]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-4">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Everything You Need to Manage Expenses Smarter
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            From receipt capture to reimbursement, simplify your expense management
            workflow with intelligent tools.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative p-6 bg-white dark:bg-[#131B2E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:shadow-emerald-100/30 dark:hover:shadow-emerald-900/10 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300"
                id={`feature-card-${index}`}
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center mb-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/60 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
