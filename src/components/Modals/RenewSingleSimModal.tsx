import React, { useState, useEffect } from 'react';
import { ExpenseItem, AccountOwner, Trader } from '../../types';

interface RenewSingleSimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRenewal: (expense: ExpenseItem) => void;
  traders: Trader[];
  initialTraderId?: string;
  initialPhoneSlot?: number;
}

export const RenewSingleSimModal: React.FC<RenewSingleSimModalProps> = ({
  isOpen,
  onClose,
  onConfirmRenewal,
  traders,
  initialTraderId,
  initialPhoneSlot,
}) => {
  const [selectedTraderId, setSelectedTraderId] = useState<string>('');
  const [amount, setAmount] = useState<string>('3500');
  const [paidBy, setPaidBy] = useState<AccountOwner>('Hamza');
  const [renewalDate, setRenewalDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('JazzCash Mobile Account');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Date formatting helpers
  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'long' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dStr;
    }
  };

  const getNextRenewalDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '—';
      const next = new Date(d);
      next.setDate(next.getDate() + 30);
      const day = next.getDate();
      const month = next.toLocaleString('en-US', { month: 'long' });
      const year = next.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Find initial trader
      let targetTrader = traders.find((t) => t.id === initialTraderId);
      if (!targetTrader && initialPhoneSlot !== undefined) {
        targetTrader = traders.find((t) => t.assignedPhoneSlot === initialPhoneSlot);
      }
      if (!targetTrader && traders.length > 0) {
        targetTrader = traders[0];
      }

      if (targetTrader) {
        setSelectedTraderId(targetTrader.id);
        setPaidBy(targetTrader.owner || 'Hamza');
      }
      setRenewalDate(new Date().toISOString().split('T')[0]);
      setAmount('3500');
      setTransactionRef('');
      setNotes('');
    }
  }, [isOpen, initialTraderId, initialPhoneSlot, traders]);

  if (!isOpen) return null;

  const currentTrader = traders.find((t) => t.id === selectedTraderId) || traders[0];
  const formattedRenewedOn = formatDisplayDate(renewalDate);
  const formattedNextRenewal = getNextRenewalDate(renewalDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !currentTrader) return;

    const renewalExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: 'PHONE_PACKAGE',
      title: `Phone ${currentTrader.assignedPhoneSlot} Monthly SIM Package`,
      description: `Monthly data package renewal for ${currentTrader.name} (${currentTrader.deviceName})`,
      amount: amountNum,
      currency: 'PKR',
      exchangeRateToUsd: 1 / 286,
      paidBy,
      date: renewalDate,
      timeAgo: 'Just now',
      traderId: currentTrader.id,
      traderName: currentTrader.name,
      phoneSlot: currentTrader.assignedPhoneSlot,
      renewedOn: formattedRenewedOn,
      nextRenewalDate: formattedNextRenewal,
      monthPeriod: new Date(renewalDate).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      paymentMethod,
      transactionRef: transactionRef.trim() || undefined,
      notes: notes.trim() || `Renewed on ${formattedRenewedOn}, next due on ${formattedNextRenewal}`,
      createdAt: new Date().toISOString(),
    };

    onConfirmRenewal(renewalExpense);
    onClose();
  };

  return (
    <div
      id="renew-single-sim-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="renew-single-sim-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-[#DEE2E6] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1A1C1E] flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-emerald-800 bg-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">smartphone</span>
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Renew Phone SIM Package</h3>
              <p className="text-[11px] text-emerald-200">
                Log single phone data renewal (Rs 3,500 PKR) &amp; update next cycle date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Trader / Phone Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Device / Trader <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {traders.map((trader) => {
                const isSelected = trader.id === selectedTraderId;
                return (
                  <button
                    key={trader.id}
                    type="button"
                    onClick={() => {
                      setSelectedTraderId(trader.id);
                      setPaidBy(trader.owner);
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-start justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                          Phone {trader.assignedPhoneSlot}
                        </span>
                        <span className="font-bold text-xs">{trader.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{trader.deviceName}</div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full mt-1 ${
                        isSelected ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Paid By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Amount */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Package Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rs</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="3500"
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                ≈ {(parseFloat(amount || '0') / 286).toFixed(2)} USDT (at 286 rate)
              </p>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Paid By (Owner) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidBy('Ismail')}
                  className={`py-1.5 px-3 rounded-lg border text-center font-bold text-xs cursor-pointer transition-colors ${
                    paidBy === 'Ismail'
                      ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ismail
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('Hamza')}
                  className={`py-1.5 px-3 rounded-lg border text-center font-bold text-xs cursor-pointer transition-colors ${
                    paidBy === 'Hamza'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Hamza
                </button>
              </div>
            </div>
          </div>

          {/* Renewal Date & Next Renewal Date Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">Renewal Date</label>
                <input
                  type="date"
                  required
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="mt-0.5 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Calculated Cycle</div>
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1 sm:justify-end mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">event_repeat</span>
                  <span>{formattedRenewedOn}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-emerald-950 font-bold">{formattedNextRenewal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="JazzCash Mobile Account">JazzCash Mobile Account</option>
                <option value="Easypaisa Transfer">Easypaisa Transfer</option>
                <option value="Bank Transfer (Meezan)">Bank Transfer (Meezan)</option>
                <option value="Bank Transfer (HBL / Nayapay)">Bank Transfer (HBL / Nayapay)</option>
                <option value="Cash / Retail Shop">Cash / Retail Shop</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Transaction ID / Ref (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. JC-9920194"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors cursor-pointer text-xs shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Confirm Renewal (Rs {parseFloat(amount || '0').toLocaleString()} PKR)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
