import React, { useState, useEffect } from 'react';
import { Account, PlannedHedge } from '../../types';
import {
  getTodayDateString,
  getTomorrowDateString,
  getIn2DaysDateString,
  parseScheduledDate,
} from '../../utils/dateHelpers';

interface PlanHedgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSavePlan: (plan: Omit<PlannedHedge, 'id' | 'createdAt'>, planId?: string) => void;
  initialAccount1Id?: string;
  editingPlan?: PlannedHedge | null;
}

const COMMON_INSTRUMENTS = ['XAUUSD', 'GBPUSD', 'AUDUSD', 'EURUSD'];

export const PlanHedgeModal: React.FC<PlanHedgeModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSavePlan,
  initialAccount1Id,
  editingPlan,
}) => {
  const activeAccounts = accounts.filter((a) => a.phase !== 'Breached' && a.phase !== 'Passed');

  const [instrument, setInstrument] = useState('XAUUSD');
  const [customInstrument, setCustomInstrument] = useState('');
  const [isCustomInstrument, setIsCustomInstrument] = useState(false);
  const [account1Id, setAccount1Id] = useState<string>('');
  const [account2Id, setAccount2Id] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('1.00');
  const [scheduledDate, setScheduledDate] = useState<string>(getTomorrowDateString());
  const [datePreset, setDatePreset] = useState<'today' | 'tomorrow' | 'in2days' | 'custom'>('tomorrow');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const today = getTodayDateString();
      const tomorrow = getTomorrowDateString();
      const in2Days = getIn2DaysDateString();

      if (editingPlan) {
        if (COMMON_INSTRUMENTS.includes(editingPlan.instrument)) {
          setInstrument(editingPlan.instrument);
          setIsCustomInstrument(false);
          setCustomInstrument('');
        } else {
          setIsCustomInstrument(true);
          setCustomInstrument(editingPlan.instrument);
          setInstrument('CUSTOM');
        }
        setAccount1Id(editingPlan.account1Id);
        setAccount2Id(editingPlan.account2Id);
        setLotSize(editingPlan.plannedLotSize ? editingPlan.plannedLotSize.toString() : '1.00');
        setNotes(editingPlan.notes || '');

        const targetD = editingPlan.scheduledDate || (editingPlan.targetDate === 'Today' ? today : tomorrow);
        setScheduledDate(targetD);
        if (targetD === today) setDatePreset('today');
        else if (targetD === tomorrow) setDatePreset('tomorrow');
        else if (targetD === in2Days) setDatePreset('in2days');
        else setDatePreset('custom');
      } else {
        // New plan defaults to tomorrow
        setInstrument('XAUUSD');
        setIsCustomInstrument(false);
        setCustomInstrument('');
        const firstId = initialAccount1Id || (activeAccounts[0] ? activeAccounts[0].id : '');
        setAccount1Id(firstId);
        const secondAccount = activeAccounts.find((a) => a.id !== firstId);
        setAccount2Id(secondAccount ? secondAccount.id : '');
        setLotSize('1.00');
        setScheduledDate(tomorrow);
        setDatePreset('tomorrow');
        setNotes('');
      }
    }
  }, [isOpen, editingPlan, initialAccount1Id]);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalInstrument = isCustomInstrument ? customInstrument.trim() : instrument;

    if (!finalInstrument) {
      setError('Please specify an instrument (e.g. XAUUSD or EURUSD)');
      return;
    }
    if (!account1Id || !account2Id) {
      setError('Please select both Account 1 and Account 2 for the hedge pairing');
      return;
    }
    if (account1Id === account2Id) {
      setError('Account 1 and Account 2 must be different accounts');
      return;
    }

    const parsedLots = parseFloat(lotSize);
    if (isNaN(parsedLots) || parsedLots <= 0) {
      setError('Please enter a valid lot size (e.g. 1.00)');
      return;
    }

    const dateInfo = parseScheduledDate(scheduledDate);

    onSavePlan(
      {
        instrument: finalInstrument,
        account1Id,
        account2Id,
        plannedLotSize: parsedLots,
        notes: notes.trim() || undefined,
        targetDate: dateInfo.relativeText,
        scheduledDate: scheduledDate,
      },
      editingPlan ? editingPlan.id : undefined
    );
    onClose();
  };

  const acc1 = accounts.find((a) => a.id === account1Id);
  const acc2 = accounts.find((a) => a.id === account2Id);
  const dateInfo = parseScheduledDate(scheduledDate);

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();
  const in2DaysStr = getIn2DaysDateString();

  return (
    <div
      id="plan-hedge-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="plan-hedge-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#DEE2E6] rounded-xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1C1E] max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {editingPlan ? 'Edit Planned Hedge Setup' : 'Plan New Hedge Execution'}
              </h3>
              <p className="text-[10px] text-slate-500">
                Pre-pair accounts and set intended execution date with built-in accidental execution protection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Intended Execution Date & Accidental Protection */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-blue-600">event</span>
                <span>Target Execution Schedule</span>
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                dateInfo.isToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {dateInfo.badgeLabel}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDatePreset('today');
                  setScheduledDate(todayStr);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  datePreset === 'today'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  setDatePreset('tomorrow');
                  setScheduledDate(tomorrowStr);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  datePreset === 'tomorrow'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() => {
                  setDatePreset('in2days');
                  setScheduledDate(in2DaysStr);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  datePreset === 'in2days'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                In 2 Days
              </button>

              <button
                type="button"
                onClick={() => setDatePreset('custom')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  datePreset === 'custom'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Custom Date
              </button>
            </div>

            {datePreset === 'custom' && (
              <div className="pt-1">
                <input
                  type="date"
                  value={scheduledDate}
                  min={todayStr}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            {dateInfo.isFuture && (
              <div className="text-[11px] text-amber-800 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">shield</span>
                <span>
                  <strong>Accidental Start Guard Active:</strong> This hedge will be tagged for <strong>{dateInfo.relativeText} ({dateInfo.formattedDateText})</strong> with confirmation warnings to prevent unintended execution today.
                </span>
              </div>
            )}
          </div>

          {/* Instrument Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Trading Instrument / Pair
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {COMMON_INSTRUMENTS.map((inst) => (
                <button
                  type="button"
                  key={inst}
                  onClick={() => {
                    setInstrument(inst);
                    setIsCustomInstrument(false);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                    !isCustomInstrument && instrument === inst
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {inst}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustomInstrument(true)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                  isCustomInstrument
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Custom...
              </button>
            </div>

            {isCustomInstrument && (
              <input
                type="text"
                placeholder="e.g. GBPJPY, USOIL, NDX"
                value={customInstrument}
                onChange={(e) => setCustomInstrument(e.target.value.toUpperCase())}
                className="w-full text-xs font-mono px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            )}
          </div>

          {/* Account Pairing Layout */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hedge Pairing Configuration
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                Opposite Legs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Account 1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Account 1 (Leg A)
                </label>
                <select
                  value={account1Id}
                  onChange={(e) => {
                    setAccount1Id(e.target.value);
                    if (e.target.value === account2Id) {
                      const other = activeAccounts.find((a) => a.id !== e.target.value);
                      if (other) setAccount2Id(other.id);
                    }
                  }}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Select Account 1 --</option>
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} • [{acc.phase}] {acc.broker} (Phone {acc.phone}) - ${acc.accountBalance.toLocaleString()}
                    </option>
                  ))}
                </select>

                {acc1 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <img
                        src={acc1.brokerLogo}
                        alt={acc1.broker}
                        className="w-4 h-4 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold text-slate-800">{acc1.broker}</span>
                      {renderPhaseBadge(acc1.phase)}
                      <span className="text-slate-400 font-mono">P{acc1.phone}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ${acc1.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Account 2 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Account 2 (Leg B)
                </label>
                <select
                  value={account2Id}
                  onChange={(e) => setAccount2Id(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Select Account 2 --</option>
                  {activeAccounts
                    .filter((a) => a.id !== account1Id)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} • [{acc.phase}] {acc.broker} (Phone {acc.phone}) - ${acc.accountBalance.toLocaleString()}
                      </option>
                    ))}
                </select>

                {acc2 && (
                  <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <img
                        src={acc2.brokerLogo}
                        alt={acc2.broker}
                        className="w-4 h-4 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold text-slate-800">{acc2.broker}</span>
                      {renderPhaseBadge(acc2.phase)}
                      <span className="text-slate-400 font-mono">P{acc2.phone}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ${acc2.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Planned Lot Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Planned Lot Size
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
              placeholder="1.00"
              className="w-full text-xs font-mono px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Default lot size applied symmetrically to both accounts upon execution (adjustable before start)
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Strategy / Setup Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. CPI news release hedge, watch 15-min candle spike..."
              className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-bold px-4 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {editingPlan ? 'save' : 'add_task'}
              </span>
              <span>{editingPlan ? 'Save Changes' : 'Add to Hedge Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
