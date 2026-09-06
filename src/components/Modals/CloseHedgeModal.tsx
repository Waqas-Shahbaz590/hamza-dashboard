import React, { useState, useEffect } from 'react';
import { Account, ActiveHedge } from '../../types';

interface CloseHedgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hedge: ActiveHedge | null;
  accounts: Account[];
  onConfirmClose: (
    hedge: ActiveHedge,
    closeBalance1: number,
    closeBalance2: number,
    closeNotes?: string
  ) => void;
}

export const CloseHedgeModal: React.FC<CloseHedgeModalProps> = ({
  isOpen,
  onClose,
  hedge,
  accounts,
  onConfirmClose,
}) => {
  const [balance1Input, setBalance1Input] = useState<string>('');
  const [balance2Input, setBalance2Input] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && hedge) {
      setError(null);
      setBalance1Input(hedge.account1StartBalance.toString());
      setBalance2Input(hedge.account2StartBalance.toString());
      setNotes('');
    }
  }, [isOpen, hedge]);

  if (!isOpen || !hedge) return null;

  const acc1 = accounts.find((a) => a.id === hedge.account1Id);
  const acc2 = accounts.find((a) => a.id === hedge.account2Id);

  if (!acc1 || !acc2) return null;

  const numBal1 = parseFloat(balance1Input);
  const numBal2 = parseFloat(balance2Input);

  const isValid1 = !isNaN(numBal1) && numBal1 >= 0;
  const isValid2 = !isNaN(numBal2) && numBal2 >= 0;

  const pnl1 = isValid1 ? numBal1 - hedge.account1StartBalance : 0;
  const pnl2 = isValid2 ? numBal2 - hedge.account2StartBalance : 0;
  const netPnL = pnl1 + pnl2;

  const pnl1Pct = hedge.account1StartBalance > 0 && isValid1 ? (pnl1 / hedge.account1StartBalance) * 100 : 0;
  const pnl2Pct = hedge.account2StartBalance > 0 && isValid2 ? (pnl2 / hedge.account2StartBalance) * 100 : 0;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

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

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid1 || !isValid2) {
      setError('Please enter valid closing balances for both accounts');
      return;
    }

    onConfirmClose(hedge, numBal1, numBal2, notes.trim() || undefined);
    onClose();
  };

  return (
    <div
      id="close-hedge-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="close-hedge-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-[#DEE2E6] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold leading-tight">
                  Close &amp; Settle Hedge
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {hedge.instrument}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Enter closing balances to calculate net profit and automatically update accounts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleClose} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Account Legs Settlement Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Account 1 Leg */}
            <div className="bg-slate-50/80 p-3.5 rounded-lg border border-[#DEE2E6] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="w-4 h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center">
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

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                      hedge.account1Side === 'BUY'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {hedge.account1Side} {hedge.account1LotSize}L
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 mb-2 truncate">
                  {acc1.accountName} <span className="text-slate-400 font-normal">({acc1.accountNumber})</span>
                </div>

                <div className="p-2 rounded bg-white border border-slate-200 mb-3 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Starting Balance:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {formatMoney(hedge.account1StartBalance)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    New Closing Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={balance1Input}
                    onChange={(e) => setBalance1Input(e.target.value)}
                    className="w-full text-sm font-mono font-bold px-3 py-1.5 border-2 border-blue-400 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Leg 1 Live PnL Pill */}
              <div
                className={`mt-3 p-2 rounded text-xs font-mono font-bold flex items-center justify-between border ${
                  pnl1 > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : pnl1 < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span>Leg 1 Result:</span>
                <span>
                  {pnl1 >= 0 ? `+${formatMoney(pnl1)}` : formatMoney(pnl1)} (
                  {pnl1Pct >= 0 ? `+${pnl1Pct.toFixed(2)}%` : `${pnl1Pct.toFixed(2)}%`})
                </span>
              </div>

              {/* Leg 1 Auto Trigger Badge */}
              {isValid1 && numBal1 <= 9000 && acc1.phase !== 'Breached' && acc1.phase !== 'Passed' && (
                <div className="mt-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-rose-600">warning</span>
                  <span>≤ $9,000 hit (-10%): Will auto-mark Breached</span>
                </div>
              )}
              {isValid1 && numBal1 >= 10800 && acc1.phase === 'Phase 1' && (
                <div className="mt-2 p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-teal-600">verified</span>
                  <span>≥ $10,800 (+8%): Will pass Phase 1 &amp; create Phase 2</span>
                </div>
              )}
              {isValid1 && numBal1 >= 10500 && acc1.phase === 'Phase 2' && (
                <div className="mt-2 p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-teal-600">rocket_launch</span>
                  <span>≥ $10,500 (+5%): Will pass Phase 2 &amp; create Live</span>
                </div>
              )}
            </div>

            {/* Account 2 Leg */}
            <div className="bg-slate-50/80 p-3.5 rounded-lg border border-[#DEE2E6] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="w-4 h-4 rounded bg-white border border-slate-200 p-0.5 flex items-center justify-center">
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

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                      hedge.account2Side === 'BUY'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {hedge.account2Side} {hedge.account2LotSize}L
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 mb-2 truncate">
                  {acc2.accountName} <span className="text-slate-400 font-normal">({acc2.accountNumber})</span>
                </div>

                <div className="p-2 rounded bg-white border border-slate-200 mb-3 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Starting Balance:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {formatMoney(hedge.account2StartBalance)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    New Closing Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={balance2Input}
                    onChange={(e) => setBalance2Input(e.target.value)}
                    className="w-full text-sm font-mono font-bold px-3 py-1.5 border-2 border-blue-400 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Leg 2 Live PnL Pill */}
              <div
                className={`mt-3 p-2 rounded text-xs font-mono font-bold flex items-center justify-between border ${
                  pnl2 > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : pnl2 < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span>Leg 2 Result:</span>
                <span>
                  {pnl2 >= 0 ? `+${formatMoney(pnl2)}` : formatMoney(pnl2)} (
                  {pnl2Pct >= 0 ? `+${pnl2Pct.toFixed(2)}%` : `${pnl2Pct.toFixed(2)}%`})
                </span>
              </div>

              {/* Leg 2 Auto Trigger Badge */}
              {isValid2 && numBal2 <= 9000 && acc2.phase !== 'Breached' && acc2.phase !== 'Passed' && (
                <div className="mt-2 p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-rose-600">warning</span>
                  <span>≤ $9,000 hit (-10%): Will auto-mark Breached</span>
                </div>
              )}
              {isValid2 && numBal2 >= 10800 && acc2.phase === 'Phase 1' && (
                <div className="mt-2 p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-teal-600">verified</span>
                  <span>≥ $10,800 (+8%): Will pass Phase 1 &amp; create Phase 2</span>
                </div>
              )}
              {isValid2 && numBal2 >= 10500 && acc2.phase === 'Phase 2' && (
                <div className="mt-2 p-1.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-teal-600">rocket_launch</span>
                  <span>≥ $10,500 (+5%): Will pass Phase 2 &amp; create Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Combined Net Hedge PnL Calculation Banner */}
          <div
            className={`p-3.5 rounded-lg border-2 flex items-center justify-between ${
              netPnL >= 0
                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950'
                : 'bg-rose-50/90 border-rose-500 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`material-symbols-outlined text-[24px] shrink-0 ${
                  netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {netPnL >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Combined Net Hedge Profit / Loss
                </span>
                <span className="text-[11px] text-slate-600">
                  Leg 1 ({pnl1 >= 0 ? `+${formatMoney(pnl1)}` : formatMoney(pnl1)}) + Leg 2 ({pnl2 >= 0 ? `+${formatMoney(pnl2)}` : formatMoney(pnl2)})
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 pl-2">
              <span
                className={`text-lg sm:text-xl font-black font-mono block ${
                  netPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {netPnL >= 0 ? `+${formatMoney(netPnL)}` : formatMoney(netPnL)}
              </span>
            </div>
          </div>

          {/* Closing Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Closing / Trade Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Closed after NY news spike, target achieved"
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#DEE2E6] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-4 py-2 rounded-md text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold px-4 py-2 rounded-md text-white bg-slate-900 hover:bg-black transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>Confirm Settlement &amp; Update Accounts</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
