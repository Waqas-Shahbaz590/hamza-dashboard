import React, { useState, useEffect } from 'react';
import { Account, PlannedHedge, ActiveHedge } from '../../types';
import { parseScheduledDate } from '../../utils/dateHelpers';

interface ExecuteHedgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlannedHedge | null;
  accounts: Account[];
  onStartHedge: (activeHedge: ActiveHedge) => void;
}

export const ExecuteHedgeModal: React.FC<ExecuteHedgeModalProps> = ({
  isOpen,
  onClose,
  plan,
  accounts,
  onStartHedge,
}) => {
  const [account1Side, setAccount1Side] = useState<'BUY' | 'SELL'>('BUY');
  const [account1Lots, setAccount1Lots] = useState<string>('1.00');
  const [account2Lots, setAccount2Lots] = useState<string>('1.00');
  const [confirmedEarlyExecution, setConfirmedEarlyExecution] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && plan) {
      setError(null);
      setAccount1Side('BUY');
      setConfirmedEarlyExecution(false);
      const defaultLots = plan.plannedLotSize ? plan.plannedLotSize.toString() : '1.00';
      setAccount1Lots(defaultLots);
      setAccount2Lots(defaultLots);
    }
  }, [isOpen, plan]);

  if (!isOpen || !plan) return null;

  const dateInfo = parseScheduledDate(plan.scheduledDate, plan.targetDate);

  const acc1 = accounts.find((a) => a.id === plan.account1Id);
  const acc2 = accounts.find((a) => a.id === plan.account2Id);

  if (!acc1 || !acc2) return null;

  const account2Side: 'BUY' | 'SELL' = account1Side === 'BUY' ? 'SELL' : 'BUY';

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

  const handleSwapSides = () => {
    setAccount1Side((prev) => (prev === 'BUY' ? 'SELL' : 'BUY'));
  };

  const handleConfirmStart = (e: React.FormEvent) => {
    e.preventDefault();
    const lots1 = parseFloat(account1Lots);
    const lots2 = parseFloat(account2Lots);

    if (isNaN(lots1) || lots1 <= 0 || isNaN(lots2) || lots2 <= 0) {
      setError('Please enter valid positive lot sizes for both legs');
      return;
    }

    if (dateInfo.isFuture && !confirmedEarlyExecution) {
      setError(`⚠️ Protection Guard: This hedge is scheduled for ${dateInfo.relativeText} (${dateInfo.formattedDateText}). Please check the confirmation box below if you intentionally want to execute early today.`);
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newActiveHedge: ActiveHedge = {
      id: `active-${Date.now()}`,
      instrument: plan.instrument,
      account1Id: acc1.id,
      account1Side,
      account1LotSize: lots1,
      account1StartBalance: acc1.accountBalance,
      account2Id: acc2.id,
      account2Side,
      account2LotSize: lots2,
      account2StartBalance: acc2.accountBalance,
      startedAt: `Today at ${timeStr}`,
      startedTimestamp: Date.now(),
      notes: plan.notes,
    };

    onStartHedge(newActiveHedge);
    onClose();
  };

  return (
    <div
      id="execute-hedge-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="execute-hedge-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl border border-[#DEE2E6] w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
          dateInfo.isFuture ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded text-white flex items-center justify-center ${
              dateInfo.isFuture ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {dateInfo.isFuture ? 'warning' : 'play_arrow'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {dateInfo.isFuture ? 'Execute Scheduled Hedge' : 'Start Live Hedge'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                  {plan.instrument}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  dateInfo.isFuture
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {dateInfo.badgeLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Assign BUY and SELL sides to your paired accounts before starting active trades.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleConfirmStart} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Future Hedge Accidental Protection Banner */}
          {dateInfo.isFuture && (
            <div className="p-3.5 rounded-lg bg-amber-50/90 border-2 border-amber-300/80 space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-amber-900 font-medium">
                <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">
                  shield_with_heart
                </span>
                <div>
                  <div className="font-bold text-amber-950 flex items-center gap-1.5">
                    <span>Accidental Start Protection:</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                      Scheduled for {dateInfo.relativeText} ({dateInfo.formattedDateText})
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    This hedge was planned <strong>{dateInfo.daysDiff} day{dateInfo.daysDiff > 1 ? 's' : ''} in advance</strong>. To prevent accidental execution today, please confirm intentional early start below.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 p-2 rounded bg-white/90 border border-amber-300 cursor-pointer select-none hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  id="checkbox-confirm-early-hedge"
                  checked={confirmedEarlyExecution}
                  onChange={(e) => {
                    setConfirmedEarlyExecution(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-950">
                  I intentionally want to execute this {dateInfo.relativeText.toLowerCase()} hedge today
                </span>
              </label>
            </div>
          )}

          {/* Quick Swap Directions Notice */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 px-3 rounded border border-slate-200">
            <div className="text-[11px] text-slate-600 font-medium">
              Which account is taking the <span className="font-bold text-emerald-700">BUY</span> side vs <span className="font-bold text-rose-700">SELL</span> side?
            </div>
            <button
              type="button"
              onClick={handleSwapSides}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-blue-600 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
              <span>Switch Sides</span>
            </button>
          </div>

          {/* Paired Accounts Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account 1 Card */}
            <div
              className={`p-3.5 rounded-lg border-2 transition-all ${
                account1Side === 'BUY'
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-rose-500 bg-rose-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="w-5 h-5 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center">
                    <img
                      src={acc1.brokerLogo}
                      alt={acc1.broker}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-900">{acc1.broker}</span>
                  {renderPhaseBadge(acc1.phase)}
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                    P{acc1.phone}
                  </span>
                </div>

                {/* Side Badge Selector */}
                <button
                  type="button"
                  onClick={() => setAccount1Side('BUY')}
                  className={`px-2.5 py-0.5 rounded text-xs font-black tracking-wide border cursor-pointer ${
                    account1Side === 'BUY'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setAccount1Side('SELL')}
                  className={`px-2.5 py-0.5 rounded text-xs font-black tracking-wide border cursor-pointer ${
                    account1Side === 'SELL'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  SELL
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-800 mb-2 truncate">
                {acc1.accountName} <span className="text-slate-400 font-normal">({acc1.accountNumber})</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Starting Balance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${acc1.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Lot Size:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={account1Lots}
                    onChange={(e) => setAccount1Lots(e.target.value)}
                    className="w-20 font-mono text-xs px-2 py-0.5 border border-slate-300 rounded bg-white text-right font-bold focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Account 2 Card */}
            <div
              className={`p-3.5 rounded-lg border-2 transition-all ${
                account2Side === 'BUY'
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-rose-500 bg-rose-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="w-5 h-5 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center">
                    <img
                      src={acc2.brokerLogo}
                      alt={acc2.broker}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-900">{acc2.broker}</span>
                  {renderPhaseBadge(acc2.phase)}
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                    P{acc2.phone}
                  </span>
                </div>

                {/* Side Badge Display */}
                <span
                  className={`px-3 py-1 rounded text-xs font-black tracking-wide ${
                    account2Side === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white shadow-xs'
                  }`}
                >
                  {account2Side}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-800 mb-2 truncate">
                {acc2.accountName} <span className="text-slate-400 font-normal">({acc2.accountNumber})</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Starting Balance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${acc2.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Lot Size:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={account2Lots}
                    onChange={(e) => setAccount2Lots(e.target.value)}
                    className="w-20 font-mono text-xs px-2 py-0.5 border border-slate-300 rounded bg-white text-right font-bold focus:ring-1 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {plan.notes && (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-amber-700 shrink-0 mt-0.5">
                notes
              </span>
              <span><strong className="font-bold">Planned Note:</strong> {plan.notes}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-[#DEE2E6] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-3.5 py-2 rounded text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {dateInfo.isFuture ? 'Keep as Planned' : 'Cancel'}
            </button>

            <button
              type="submit"
              id="btn-confirm-start-active-hedge"
              className={`text-xs font-bold px-4 py-2 rounded text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 ${
                dateInfo.isFuture && !confirmedEarlyExecution
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {dateInfo.isFuture ? 'bolt' : 'rocket_launch'}
              </span>
              <span>
                {dateInfo.isFuture
                  ? confirmedEarlyExecution
                    ? 'Execute Early Now'
                    : 'Confirm & Execute Early'
                  : 'Start Active Hedge'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

