import React, { useState, useEffect } from 'react';
import { Account, PlannedHedge, ActiveHedge, ClosedHedge } from '../types';
import { parseScheduledDate } from '../utils/dateHelpers';

interface HedgeManagerViewProps {
  accounts: Account[];
  plannedHedges: PlannedHedge[];
  activeHedges: ActiveHedge[];
  closedHedges: ClosedHedge[];
  onOpenPlanModal: (initialAccId?: string, editPlan?: PlannedHedge) => void;
  onOpenExecuteModal: (plan: PlannedHedge) => void;
  onOpenCloseModal: (hedge: ActiveHedge) => void;
  onDeletePlan: (planId: string) => void;
  onClearClosedHistory?: () => void;
}

export const HedgeManagerView: React.FC<HedgeManagerViewProps> = ({
  accounts,
  plannedHedges,
  activeHedges,
  closedHedges,
  onOpenPlanModal,
  onOpenExecuteModal,
  onOpenCloseModal,
  onDeletePlan,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'history'>('all');
  const [plannedFilter, setPlannedFilter] = useState<'all' | 'today' | 'future'>('all');
  const [, setTick] = useState(0);

  // Live timer tick every 30s to update duration labels
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getAccountById = (id: string) => {
    return accounts.find((a) => a.id === id);
  };

  const validActiveHedges = activeHedges.filter((h) => {
    return !!(getAccountById(h.account1Id) && getAccountById(h.account2Id));
  });

  const validPlannedHedges = plannedHedges.filter((p) => {
    return !!(getAccountById(p.account1Id) && getAccountById(p.account2Id));
  });

  const todayPlans = validPlannedHedges.filter(
    (p) => parseScheduledDate(p.scheduledDate, p.targetDate).isToday
  );
  const futurePlans = validPlannedHedges.filter(
    (p) => parseScheduledDate(p.scheduledDate, p.targetDate).isFuture
  );

  const displayedPlannedHedges = validPlannedHedges.filter((p) => {
    const info = parseScheduledDate(p.scheduledDate, p.targetDate);
    if (plannedFilter === 'today') return info.isToday;
    if (plannedFilter === 'future') return info.isFuture;
    return true;
  });

  const renderPhaseBadge = (phase: string) => {
    if (phase === 'Live') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      );
    }
    if (phase === 'Phase 1') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Phase 1
        </span>
      );
    }
    if (phase === 'Phase 2') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Phase 2
        </span>
      );
    }
    if (phase === 'Breached') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Breached
        </span>
      );
    }
    if (phase === 'Passed') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <span className="material-symbols-outlined text-[12px] text-teal-600">check_circle</span>
          Passed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {phase}
      </span>
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const calculateDuration = (startTimestamp: number) => {
    const diffMs = Math.max(0, Date.now() - startTimestamp);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const totalHistoricalNetPnL = closedHedges.reduce((sum, h) => sum + h.netPnL, 0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded border border-[#DEE2E6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">swap_horiz</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Hedge Manager
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Dual-Account Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Plan tomorrow&apos;s paired hedges, execute opposite BUY/SELL legs in real-time, and settle closing balances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-plan-new-hedge-header"
              onClick={() => onOpenPlanModal()}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-3.5 py-2 rounded flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Plan Hedge for Tomorrow</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded border border-[#DEE2E6] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                ACTIVE LIVE HEDGES
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {validActiveHedges.length}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Running
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">play_circle</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#DEE2E6] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                PLANNED SETUPS
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-blue-600">
                  {validPlannedHedges.length}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  {todayPlans.length} Today • {futurePlans.length} Future
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#DEE2E6] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                SETTLED HEDGE NET P&amp;L
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-bold font-mono ${
                    totalHistoricalNetPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {totalHistoricalNetPnL >= 0 ? `+${formatCurrency(totalHistoricalNetPnL)}` : formatCurrency(totalHistoricalNetPnL)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                  {closedHedges.length} Settled
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: ACTIVE HEDGES */}
        <div
          id="active-hedges-section"
          className="bg-white border border-[#DEE2E6] rounded overflow-hidden shadow-xs"
        >
          <div className="p-3.5 px-4 border-b border-[#DEE2E6] bg-emerald-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Active Live Hedges
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                {validActiveHedges.length} Running
              </span>
            </div>
          </div>

          <div className="p-4">
            {validActiveHedges.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded border border-dashed border-slate-300">
                <span className="material-symbols-outlined text-[36px] text-slate-400 block mb-1">
                  hourglass_empty
                </span>
                <h3 className="text-sm font-bold text-slate-700">No Active Hedges Running</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-3">
                  You do not have any open hedges at the moment. Hit <strong className="font-semibold text-slate-700">&quot;Start Hedge&quot;</strong> on any planned setup below to begin live execution.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {validActiveHedges.map((hedge) => {
                  const acc1 = getAccountById(hedge.account1Id);
                  const acc2 = getAccountById(hedge.account2Id);
                  if (!acc1 || !acc2) return null;

                  const duration = calculateDuration(hedge.startedTimestamp);

                  return (
                    <div
                      key={hedge.id}
                      id={`active-hedge-card-${hedge.id}`}
                      className="bg-white border-2 border-emerald-500/80 rounded-lg p-4 shadow-sm space-y-3"
                    >
                      {/* Hedge Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs tracking-wider">
                            {hedge.instrument}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Active ({duration})
                          </span>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            Started {hedge.startedAt}
                          </span>
                        </div>

                        {/* Close Hedge Button */}
                        <button
                          id={`btn-close-hedge-${hedge.id}`}
                          onClick={() => onOpenCloseModal(hedge)}
                          className="text-xs font-bold px-3.5 py-1.5 rounded bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px] text-emerald-400">
                            check_circle
                          </span>
                          <span>Close &amp; Settle Hedge</span>
                        </button>
                      </div>

                      {/* Paired Legs Visual Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                        {/* Leg 1 */}
                        <div
                          className={`p-3 rounded border flex items-center justify-between ${
                            hedge.account1Side === 'BUY'
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={acc1.brokerLogo}
                                alt={acc1.broker}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {acc1.accountName}
                                </span>
                                {renderPhaseBadge(acc1.phase)}
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                                  Phone {acc1.phone}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono block">
                                Start Bal: {formatCurrency(hedge.account1StartBalance)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-xs font-black tracking-wider ${
                                hedge.account1Side === 'BUY'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {hedge.account1Side} {hedge.account1LotSize}L
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                              {acc1.broker}
                            </span>
                          </div>
                        </div>

                        {/* Leg 2 */}
                        <div
                          className={`p-3 rounded border flex items-center justify-between ${
                            hedge.account2Side === 'BUY'
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={acc2.brokerLogo}
                                alt={acc2.broker}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {acc2.accountName}
                                </span>
                                {renderPhaseBadge(acc2.phase)}
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                                  Phone {acc2.phone}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono block">
                                Start Bal: {formatCurrency(hedge.account2StartBalance)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-xs font-black tracking-wider ${
                                hedge.account2Side === 'BUY'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {hedge.account2Side} {hedge.account2LotSize}L
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                              {acc2.broker}
                            </span>
                          </div>
                        </div>
                      </div>

                      {hedge.notes && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            description
                          </span>
                          <span>{hedge.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: PLANNED HEDGES */}
        <div
          id="planned-hedges-section"
          className="bg-white border border-[#DEE2E6] rounded overflow-hidden shadow-xs"
        >
          <div className="p-3.5 px-4 border-b border-[#DEE2E6] bg-blue-50/60 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">
                event_upcoming
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Planned Hedges
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                {validPlannedHedges.length} Total
              </span>
            </div>

            {/* Filter Tabs for Date Schedules */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-blue-200">
              <button
                type="button"
                onClick={() => setPlannedFilter('all')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  plannedFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({validPlannedHedges.length})
              </button>
              <button
                type="button"
                onClick={() => setPlannedFilter('today')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  plannedFilter === 'today'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Ready Today ({todayPlans.length})
              </button>
              <button
                type="button"
                onClick={() => setPlannedFilter('future')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  plannedFilter === 'future'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Advance ({futurePlans.length})
              </button>
            </div>

            <button
              onClick={() => onOpenPlanModal()}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-blue-200"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
              <span>+ Plan New Hedge</span>
            </button>
          </div>

          <div className="p-4">
            {displayedPlannedHedges.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded border border-dashed border-slate-300">
                <span className="material-symbols-outlined text-[36px] text-slate-400 block mb-1">
                  calendar_add_on
                </span>
                <h3 className="text-sm font-bold text-slate-700">
                  {plannedFilter === 'all'
                    ? 'No Planned Hedges'
                    : plannedFilter === 'today'
                    ? 'No Hedges Scheduled for Today'
                    : 'No Future Hedges Scheduled'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-3">
                  Pre-pair accounts and instruments days in advance with automatic execution safeguards.
                </p>
                <button
                  onClick={() => onOpenPlanModal()}
                  className="text-xs font-bold px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                >
                  + Create Planned Setup
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedPlannedHedges.map((plan) => {
                  const acc1 = getAccountById(plan.account1Id);
                  const acc2 = getAccountById(plan.account2Id);
                  if (!acc1 || !acc2) return null;

                  const dateInfo = parseScheduledDate(plan.scheduledDate, plan.targetDate);

                  return (
                    <div
                      key={plan.id}
                      id={`planned-hedge-card-${plan.id}`}
                      className={`bg-white border rounded-lg p-3.5 transition-all shadow-2xs space-y-3 ${
                        dateInfo.isFuture
                          ? 'border-amber-200 hover:border-amber-300'
                          : 'border-[#DEE2E6] hover:border-emerald-300'
                      }`}
                    >
                      {/* Plan Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-xs">
                            {plan.instrument}
                          </span>
                          
                          {/* Schedule Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                              dateInfo.isToday
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {dateInfo.isToday ? 'bolt' : 'event'}
                            </span>
                            <span>{dateInfo.badgeLabel}</span>
                          </span>

                          <span className="text-[11px] font-bold text-slate-500">
                            {plan.plannedLotSize || 1.0} Lot
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            title="Edit Plan"
                            onClick={() => onOpenPlanModal(undefined, plan)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            title="Delete Plan"
                            onClick={() => onDeletePlan(plan.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Paired Accounts Preview */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Acc 1 */}
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <div className="w-4 h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={acc1.brokerLogo}
                                alt={acc1.broker}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {acc1.broker}
                            </span>
                            {renderPhaseBadge(acc1.phase)}
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                              P{acc1.phone}
                            </span>
                          </div>
                          <div className="font-medium text-slate-700 truncate text-[11px]">
                            {acc1.accountName}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            Bal: {formatCurrency(acc1.accountBalance)}
                          </div>
                        </div>

                        {/* Acc 2 */}
                        <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <div className="w-4 h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={acc2.brokerLogo}
                                alt={acc2.broker}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="font-bold text-slate-800 truncate text-[11px]">
                              {acc2.broker}
                            </span>
                            {renderPhaseBadge(acc2.phase)}
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                              P{acc2.phone}
                            </span>
                          </div>
                          <div className="font-medium text-slate-700 truncate text-[11px]">
                            {acc2.accountName}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            Bal: {formatCurrency(acc2.accountBalance)}
                          </div>
                        </div>
                      </div>

                      {plan.notes && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded border border-amber-200">
                          <strong>Note:</strong> {plan.notes}
                        </div>
                      )}

                      {/* Start Live Hedge CTA */}
                      <button
                        id={`btn-start-planned-hedge-${plan.id}`}
                        onClick={() => onOpenExecuteModal(plan)}
                        className={`w-full text-xs font-bold py-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                          dateInfo.isFuture
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {dateInfo.isFuture ? 'shield_with_heart' : 'play_arrow'}
                        </span>
                        <span>
                          {dateInfo.isFuture
                            ? `Execute Early (${dateInfo.relativeText})`
                            : 'Start Hedge (Ready Today)'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: SETTLED HEDGES HISTORY */}
        <div
          id="closed-hedges-section"
          className="bg-white border border-[#DEE2E6] rounded overflow-hidden shadow-xs"
        >
          <div className="p-3.5 px-4 border-b border-[#DEE2E6] bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-600">
                receipt_long
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Closed Hedges History (Settlement Ledger)
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                {closedHedges.length} Settled
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
              <thead className="bg-slate-50 border-b border-[#DEE2E6] text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Instrument</th>
                  <th className="px-4 py-2.5">Leg 1 (Start &rarr; Close)</th>
                  <th className="px-4 py-2.5">Leg 2 (Start &rarr; Close)</th>
                  <th className="px-4 py-2.5 text-right">Net Hedge P&amp;L</th>
                  <th className="px-4 py-2.5">Closed At</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-[11px]">
                {closedHedges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                      No closed hedges yet. Settle an active hedge to record its outcome here.
                    </td>
                  </tr>
                ) : (
                  closedHedges.map((ch) => {
                    const acc1 = getAccountById(ch.account1Id);
                    const acc2 = getAccountById(ch.account2Id);

                    return (
                      <tr key={ch.id} className="data-table-row hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {ch.instrument}
                          </span>
                        </td>

                        {/* Leg 1 */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-1 py-0.2 rounded text-white ${
                                ch.account1Side === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            >
                              {ch.account1Side}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {ch.account1Name} ({ch.account1Broker} P{ch.account1Phone}):
                            </span>
                            {acc1 && renderPhaseBadge(acc1.phase)}
                            <span className="font-mono text-slate-500">
                              {formatCurrency(ch.account1StartBalance)} &rarr; {formatCurrency(ch.account1CloseBalance)}
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                ch.account1PnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              ({ch.account1PnL >= 0 ? `+${formatCurrency(ch.account1PnL)}` : formatCurrency(ch.account1PnL)})
                            </span>
                          </div>
                        </td>

                        {/* Leg 2 */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-1 py-0.2 rounded text-white ${
                                ch.account2Side === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            >
                              {ch.account2Side}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {ch.account2Name} ({ch.account2Broker} P{ch.account2Phone}):
                            </span>
                            {acc2 && renderPhaseBadge(acc2.phase)}
                            <span className="font-mono text-slate-500">
                              {formatCurrency(ch.account2StartBalance)} &rarr; {formatCurrency(ch.account2CloseBalance)}
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                ch.account2PnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              ({ch.account2PnL >= 0 ? `+${formatCurrency(ch.account2PnL)}` : formatCurrency(ch.account2PnL)})
                            </span>
                          </div>
                        </td>

                        {/* Net Hedge PnL */}
                        <td className="px-4 py-2.5 text-right font-mono font-black text-xs">
                          <span
                            className={`px-2 py-0.5 rounded border ${
                              ch.netPnL >= 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {ch.netPnL >= 0 ? `+${formatCurrency(ch.netPnL)}` : formatCurrency(ch.netPnL)}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-slate-500 font-sans">
                          {ch.closedAt} {ch.durationText ? `(${ch.durationText})` : ''}
                        </td>

                        <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                          {ch.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
