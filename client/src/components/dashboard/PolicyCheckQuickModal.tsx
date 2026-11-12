import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Plane, Utensils, Hotel, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyCheckQuickModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [expenseType, setExpenseType] = useState<'flight' | 'hotel' | 'meal'>('flight');
  const [flightClass, setFlightClass] = useState('Economy');
  const [flightCost, setFlightCost] = useState('450');
  const [hotelNightRate, setHotelNightRate] = useState('195');
  const [mealAmount, setMealAmount] = useState('65');

  if (!isOpen) return null;

  // Real-time evaluation
  const evaluate = () => {
    if (expenseType === 'flight') {
      const isEconomy = flightClass === 'Economy';
      const cost = parseFloat(flightCost) || 0;
      if (!isEconomy) {
        return {
          status: 'violation',
          title: 'Policy Violation: Premium Flight Class',
          message: 'Corporate Travel Policy permits Economy Class only for domestic and standard business travel. First/Business Class requires VP prior authorization.',
          recommendation: 'Switch ticket class to Economy or request an exception from your Vice President.'
        };
      }
      if (cost > 2500) {
        return {
          status: 'warning',
          title: 'Policy Warning: High-Value Airfare',
          message: `Airfare of $${cost.toFixed(2)} exceeds standard pre-approved threshold ($2,500.00).`,
          recommendation: 'Requires secondary Finance Director approval prior to reimbursement.'
        };
      }
      return {
        status: 'passed',
        title: 'Policy Compliant: Standard Economy Flight',
        message: 'Flight booking complies with all corporate travel class and budget limits.',
        recommendation: 'Proceed with booking. Remember to retain your itemized boarding pass or e-ticket.'
      };
    } else if (expenseType === 'hotel') {
      const rate = parseFloat(hotelNightRate) || 0;
      if (rate > 250) {
        return {
          status: 'warning',
          title: 'Policy Warning: Hotel Rate Exceeds Cap',
          message: `Nightly rate of $${rate.toFixed(2)} exceeds the standard destination lodging cap ($250.00/night).`,
          recommendation: 'Provide conference venue justification or high-season rate notes in expense filing.'
        };
      }
      return {
        status: 'passed',
        title: 'Policy Compliant: Standard Lodging Rate',
        message: 'Nightly lodging rate is within company destination guidelines ($250/night maximum).',
        recommendation: 'Ensure itemized hotel folio shows zero room-service alcohol charges.'
      };
    } else {
      const meal = parseFloat(mealAmount) || 0;
      if (meal > 75) {
        return {
          status: 'warning',
          title: 'Policy Warning: Daily Meal Allowance Exceeded',
          message: `Single meal of $${meal.toFixed(2)} exceeds the $75.00 daily per-employee allowance limit.`,
          recommendation: 'If this was a client dinner, list all attendee names and business affiliation.'
        };
      }
      return {
        status: 'passed',
        title: 'Policy Compliant: Within Meal Allowance',
        message: 'Meal expenditure is within the standard $75.00 daily allowance guideline.',
        recommendation: 'Receipt required if single charge exceeds $25.00.'
      };
    }
  };

  const result = evaluate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Instant Travel Policy Checker
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              onClick={() => setExpenseType('flight')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                expenseType === 'flight' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Plane className="w-3.5 h-3.5" /> Flights
            </button>
            <button
              onClick={() => setExpenseType('hotel')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                expenseType === 'hotel' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Hotel className="w-3.5 h-3.5" /> Lodging
            </button>
            <button
              onClick={() => setExpenseType('meal')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                expenseType === 'meal' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> Meals
            </button>
          </div>

          {/* Form fields based on category */}
          {expenseType === 'flight' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Cabin Class</label>
                <select
                  value={flightClass}
                  onChange={(e) => setFlightClass(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Economy">Economy / Standard Coach (Policy Default)</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business Class">Business Class (Requires VP approval)</option>
                  <option value="First Class">First Class (Requires VP approval)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Ticket Price ($ USD)</label>
                <input
                  type="number"
                  value={flightCost}
                  onChange={(e) => setFlightCost(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
            </div>
          )}

          {expenseType === 'hotel' && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nightly Room Rate ($ USD / Night)</label>
              <input
                type="number"
                value={hotelNightRate}
                onChange={(e) => setHotelNightRate(e.target.value)}
                className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Company standard limit: $250.00 / night excluding municipal taxes.</span>
            </div>
          )}

          {expenseType === 'meal' && (
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Meal Amount ($ USD)</label>
              <input
                type="number"
                value={mealAmount}
                onChange={(e) => setMealAmount(e.target.value)}
                className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Company standard limit: $75.00 / person / day.</span>
            </div>
          )}

          {/* Real-time Policy Assessment Card */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-1.5 ${
              result.status === 'violation'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                : result.status === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-sm">
              {result.status === 'violation' ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : result.status === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              )}
              {result.title}
            </div>
            <p className="opacity-90">{result.message}</p>
            <div className="pt-1 font-semibold text-[11px]">
              <span className="opacity-75">Guideline: </span>
              {result.recommendation}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl text-xs"
          >
            Close Check
          </button>
        </div>
      </div>
    </div>
  );
};
