import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DashboardPreview } from './DashboardPreview';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 overflow-hidden"
    >
      {/* Subtle mint background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white dark:from-emerald-950/20 dark:via-[#0B0F19] dark:to-[#0B0F19]" />

      {/* Decorative orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column — Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Intelligent Expense Management
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-5">
              Smarter Expenses for a{' '}
              <span className="text-emerald-600 dark:text-emerald-400">Better Tomorrow</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              Take control of business spending with intelligent expense tracking,
              automated receipt processing, smart categorization, and streamlined
              reimbursement workflows—all in one simple platform.
            </p>

            <button
              onClick={() => navigate('/register')}
              className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all cursor-pointer"
              id="hero-get-started"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Manage expenses smarter. Simplify your workflow.
            </p>
          </div>

          {/* Right column — Dashboard Preview */}
          <div className="lg:pl-4">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
};
