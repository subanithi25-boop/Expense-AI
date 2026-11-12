import React from 'react';
import { Camera, FolderSearch, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'Capture Expenses',
    description: 'Record expenses and add receipt details in one place.',
  },
  {
    number: '02',
    icon: FolderSearch,
    title: 'Review and Organize',
    description: 'Categorize transactions and review expenses for policy compliance.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Track and Report',
    description: 'Monitor spending, review summaries, and follow reimbursement progress.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-24 bg-slate-50/70 dark:bg-[#0E1525]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-4">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Expense Management Made Simple
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200 dark:from-emerald-800 dark:via-emerald-700 dark:to-emerald-800" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative flex flex-col items-center text-center" id={`step-${index}`}>
                {/* Step number ring */}
                <div className="relative z-10 mb-5">
                  <div className="w-[104px] h-[104px] rounded-full bg-white dark:bg-[#131B2E] border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-emerald-600/30">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
