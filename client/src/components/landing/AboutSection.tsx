import React from 'react';
import { Layers } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 sm:py-24 bg-white dark:bg-[#0B0F19]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-4">
            <Layers className="w-3.5 h-3.5" />
            About
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            A Smarter Way to Handle Business Spending
          </h2>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            SpendWise AI is designed to make expense management more organized,
            transparent, and convenient. By bringing expense records, receipt
            information, policy reviews, and spending insights together, the
            platform helps simplify everyday financial workflows.
          </p>
        </div>
      </div>
    </section>
  );
};
