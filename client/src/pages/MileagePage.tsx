import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mileageApi } from '../services/api';
import { MileageClaim } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import confetti from 'canvas-confetti';
import {
  Navigation,
  MapPin,
  Calculator,
  CheckCircle,
  Car,
  Compass,
  ArrowRight
} from 'lucide-react';

export const MileagePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<MileageClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state - Clean empty defaults for manual user entry
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [travelDate, setTravelDate] = useState('');

  // Calculation preview - Initially 0 until user calculates route
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [ratePerMile, setRatePerMile] = useState<number>(0.67);
  const [estimatedReimbursement, setEstimatedReimbursement] = useState<number>(0);
  const [calcMethod, setCalcMethod] = useState<string>('Standard IRS Rate Formula');
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const data = await mileageApi.getClaims();
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [currentUser]);

  const handleCalculateRoute = async () => {
    if (!origin.trim() || !destination.trim()) return;

    setCalculating(true);
    try {
      const data = await mileageApi.calculate(origin.trim(), destination.trim());
      const miles = Number(data.distanceMiles) || 0;
      const rate = Number(data.ratePerMile) || 0.67;
      const reimbursement = Math.round(miles * rate * 100) / 100;

      setDistanceMiles(miles);
      setRatePerMile(rate);
      setEstimatedReimbursement(reimbursement);
      setCalcMethod(data.calculationMethod || 'Verified Routing Matrix');
    } catch (err) {
      console.error('Failed to calculate route distance:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || !businessPurpose.trim() || !travelDate || distanceMiles <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      await mileageApi.submitClaim({
        origin: origin.trim(),
        destination: destination.trim(),
        distanceMiles,
        businessPurpose: businessPurpose.trim(),
        travelDate
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Clear the form fields after successful submission
      setOrigin('');
      setDestination('');
      setBusinessPurpose('');
      setTravelDate('');
      setDistanceMiles(0);
      setEstimatedReimbursement(0);
      setCalcMethod('Standard IRS Rate Formula');

      fetchClaims();
    } catch (err) {
      console.error('Failed to submit mileage claim:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalMiles = claims.reduce((sum, c) => sum + c.distanceMiles, 0);
  const totalReimbursed = claims.reduce((sum, c) => sum + c.totalReimbursement, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Business Mileage Tracking & Route Calculator
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                IRS 2026 Rate ($0.67/mi)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Calculate point-to-point road travel distance, apply standard corporate mileage rates, and submit claims.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Mileage Logged</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalMiles.toFixed(1)} <span className="text-sm font-semibold text-slate-400">miles</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Mileage Reimbursements</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ${totalReimbursed.toFixed(2)}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Configured Standard Rate</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              $0.67 <span className="text-xs font-semibold text-slate-400">/ mile</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Split: Interactive Route Calculator Form (Left) & Mileage Claims Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Calculator Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-white dark:bg-[#131B2E] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Navigation className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                New Mileage Reimbursement Claim
              </h3>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Origin Starting Location *
                </label>
                <div className="relative mt-1">
                  <MapPin className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      if (distanceMiles > 0) {
                        setDistanceMiles(0);
                        setEstimatedReimbursement(0);
                      }
                    }}
                    placeholder="Enter starting location"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Destination *
                </label>
                <div className="relative mt-1">
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      if (distanceMiles > 0) {
                        setDistanceMiles(0);
                        setEstimatedReimbursement(0);
                      }
                    }}
                    placeholder="Enter destination"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Recalculate Route Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCalculateRoute}
                  disabled={calculating || !origin.trim() || !destination.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-all"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {calculating ? 'Calculating Route...' : 'Recalculate Route'}
                </button>
              </div>

              {/* Live Distance & Formula Display */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Routing Distance:</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {distanceMiles > 0 ? `${distanceMiles} miles` : '0.0 miles'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">IRS Mileage Rate:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">${ratePerMile.toFixed(2)}/mile</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Total Reimbursement:</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    ${estimatedReimbursement.toFixed(2)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  Formula: {distanceMiles} mi × ${ratePerMile.toFixed(2)}/mi = ${estimatedReimbursement.toFixed(2)} ({calcMethod})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={businessPurpose}
                  onChange={(e) => setBusinessPurpose(e.target.value)}
                  placeholder="Enter business purpose"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Travel Date *
                </label>
                <input
                  type="date"
                  required
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !origin.trim() || !destination.trim() || !businessPurpose.trim() || !travelDate || distanceMiles <= 0}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Submitting Claim...' : 'Submit Mileage Claim'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 7 Cols: Submitted Claims History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#131B2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Submitted Business Mileage History
            </h3>

            <div className="space-y-3">
              {claims.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No mileage claims logged yet.
                </div>
              ) : (
                claims.map(c => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{c.origin}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.destination}</span>
                      </div>
                      <div className="text-slate-500">
                        Purpose: <span className="text-slate-700 dark:text-slate-300">{c.businessPurpose}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.travelDate} • {c.distanceMiles} miles (@ ${c.ratePerMile}/mi)
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${c.totalReimbursement.toFixed(2)}
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
