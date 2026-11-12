import React from 'react';
import { ScanLine, Tags, ClipboardCheck, BarChart3 } from 'lucide-react';

const highlights = [
  {
    icon: ScanLine,
    title: 'AI Receipt Processing',
    description: 'Reduce manual receipt entry.',
  },
  {
    icon: Tags,
    title: 'Smart Categorization',
    description: 'Keep expenses organized.',
  },
  {
    icon: ClipboardCheck,
    title: 'Policy Review',
    description: 'Support structured expense checks.',
  },
  {
    icon: BarChart3,
    title: 'Spending Insights',
    description: 'Understand expense patterns.',
  },
];

export const HighlightSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 bg-[#101828] relative overflow-hidden">
      {/* Decorative accents */}
      <div className="absolute top-0 left-1/3 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 text-xs font-medium mb-4">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Everything in One Smarter Expense Platform
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Discover the tools that help simplify expense management.
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-700/50 hover:bg-slate-800/70 transition-all duration-300"
                id={`highlight-${index}`}
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-900/40 border border-emerald-700/30 flex items-center justify-center mb-4 group-hover:bg-emerald-900/60 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-400" />
                </div>

                <h3 className="text-base font-bold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
