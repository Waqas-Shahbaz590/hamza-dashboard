import React, { useState, useEffect } from 'react';
import { ExpenseItem, ExpenseCategory, ExpenseCurrency, AccountOwner, Trader, Account } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: ExpenseItem) => void;
  editingExpense?: ExpenseItem | null;
  traders: Trader[];
  accounts: Account[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  editingExpense,
  traders,
  accounts,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('PHONE_PACKAGE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('3500');
  const [currency, setCurrency] = useState<ExpenseCurrency>('PKR');
  const [paidBy, setPaidBy] = useState<AccountOwner>('Hamza');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Specific links
  const [selectedTraderId, setSelectedTraderId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [monthPeriod, setMonthPeriod] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });
  const [paymentMethod, setPaymentMethod] = useState('JazzCash');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-switch defaults when category changes (if not editing)
  useEffect(() => {
    if (!editingExpense) {
      if (category === 'PHONE_PACKAGE') {
        setCurrency('PKR');
        setAmount('3500');
        setPaymentMethod('JazzCash Mobile Account');
        if (traders.length > 0 && !selectedTraderId) {
          setSelectedTraderId(traders[0].id);
          setTitle(`Phone ${traders[0].assignedPhoneSlot} Monthly SIM Package`);
          setPaidBy(traders[0].owner);
        } else {
          setTitle(`Phone 1 Monthly SIM Package`);
        }
      } else if (category === 'ACCOUNT_FEE') {
        setCurrency('USDT');
        setAmount('150');
        setPaymentMethod('Binance USDT (TRC-20)');
        if (accounts.length > 0 && !selectedAccountId) {
          const phase1Acc = accounts.find((a) => a.phase === 'Phase 1') || accounts[0];
          setSelectedAccountId(phase1Acc.id);
          const sizeNum = phase1Acc.accountBalance || 10000;
          const sizeLabel = sizeNum >= 1000 ? `${(sizeNum / 1000).toFixed(0)}k` : `${sizeNum}`;
          setTitle(`${phase1Acc.broker} Phase 1 ${sizeLabel} account`);
          if (phase1Acc.owner) setPaidBy(phase1Acc.owner);
        } else {
          setTitle('Thrivers Phase 1 10k account');
        }
      } else if (category === 'VPS_INFRA') {
        setCurrency('USDT');
        setAmount('45');
        setPaymentMethod('USDT (TRC-20)');
        setTitle('Dedicated Edge Proxy Node');
      } else {
        setCurrency('USDT');
        setTitle('General Operational Expense');
      }
    }
  }, [category, editingExpense]);

  // Load existing expense if editing
  useEffect(() => {
    if (editingExpense) {
      setCategory(editingExpense.category);
      setTitle(editingExpense.title);
      setDescription(editingExpense.description || '');
      setAmount(editingExpense.amount.toString());
      setCurrency(editingExpense.currency);
      setPaidBy(editingExpense.paidBy);
      setDate(editingExpense.date);
      setSelectedTraderId(editingExpense.traderId || '');
      setSelectedAccountId(editingExpense.accountId || '');
      setMonthPeriod(editingExpense.monthPeriod || '');
      setPaymentMethod(editingExpense.paymentMethod || '');
      setTransactionRef(editingExpense.transactionRef || '');
      setNotes(editingExpense.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingExpense, isOpen]);

  const handleTraderChange = (traderId: string) => {
    setSelectedTraderId(traderId);
    const target = traders.find((t) => t.id === traderId);
    if (target) {
      setTitle(`Phone ${target.assignedPhoneSlot} Monthly SIM Package`);
      setDescription(`Mobile data renewal for ${target.name} (${target.deviceName})`);
      setPaidBy(target.owner);
    }
  };

  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    const target = accounts.find((a) => a.id === accId);
    if (target) {
      const sizeNum = target.accountBalance || 10000;
      const sizeLabel = sizeNum >= 1000 ? `${(sizeNum / 1000).toFixed(0)}k` : `${sizeNum}`;
      setTitle(`${target.broker} Phase 1 ${sizeLabel} account`);
      setDescription(`Initial challenge evaluation fee for ${target.accountName} on ${target.broker}`);
      if (target.owner) setPaidBy(target.owner);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || !title.trim()) return;

    let targetTraderName: string | undefined;
    let targetPhoneSlot: number | undefined;
    let computedRenewedOn: string | undefined;
    let computedNextRenewal: string | undefined;

    if (category === 'PHONE_PACKAGE') {
      try {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'long' });
        const year = d.getFullYear();
        computedRenewedOn = `${day} ${month} ${year}`;

        const next = new Date(d);
        next.setDate(next.getDate() + 30);
        const nDay = next.getDate();
        const nMonth = next.toLocaleString('en-US', { month: 'long' });
        const nYear = next.getFullYear();
        computedNextRenewal = `${nDay} ${nMonth} ${nYear}`;
      } catch {
        computedRenewedOn = date;
      }

      if (selectedTraderId) {
        const tr = traders.find((t) => t.id === selectedTraderId);
        if (tr) {
          targetTraderName = tr.name;
          targetPhoneSlot = tr.assignedPhoneSlot;
        }
      }
    }

    let targetAccName: string | undefined;
    let targetAccPhase: any;
    let targetBroker: any;
    let targetSize: string | undefined;

    if (category === 'ACCOUNT_FEE' && selectedAccountId) {
      const ac = accounts.find((a) => a.id === selectedAccountId);
      if (ac) {
        targetAccName = ac.accountName;
        targetAccPhase = ac.phase;
        targetBroker = ac.broker;
        const sizeNum = ac.accountBalance || 10000;
        targetSize = sizeNum >= 1000 ? `${(sizeNum / 1000).toFixed(0)}k` : `${sizeNum}`;
      }
    } else if (category === 'ACCOUNT_FEE') {
      // detect broker from title if present
      if (title.toLowerCase().includes('thrivers') || title.toLowerCase().includes('yahoodi')) targetBroker = 'Thrivers';
      else if (title.toLowerCase().includes('fundpips') || title.toLowerCase().includes('bengali')) targetBroker = 'Fundpips';
    }

    const savedItem: ExpenseItem = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      category,
      title: title.trim(),
      description: description.trim() || undefined,
      amount: amountNum,
      currency,
      exchangeRateToUsd: currency === 'PKR' ? 1 / 286 : 1,
      paidBy,
      broker: targetBroker,
      date,
      timeAgo: 'Just now',
      accountId: selectedAccountId || undefined,
      accountName: targetAccName,
      accountPhase: targetAccPhase,
      accountSize: targetSize,
      traderId: selectedTraderId || undefined,
      traderName: targetTraderName,
      phoneSlot: targetPhoneSlot,
      renewedOn: computedRenewedOn,
      nextRenewalDate: computedNextRenewal,
      monthPeriod: monthPeriod || undefined,
      paymentMethod: paymentMethod || undefined,
      transactionRef: transactionRef.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    onSaveExpense(savedItem);
    onClose();
  };

  return (
    <div
      id="add-expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="add-expense-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-[#DEE2E6] w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-[#1A1C1E]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                {editingExpense ? 'edit' : 'receipt_long'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                {editingExpense ? 'Edit Finance Expense' : 'Log New Expense'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Track account fees in USDT, monthly phone SIM packages in PKR, and owner splits
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Category Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('PHONE_PACKAGE')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'PHONE_PACKAGE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-600 mb-0.5">
                  stay_current_portrait
                </span>
                <span className="text-[11px] leading-tight">Phone SIM (PKR)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('ACCOUNT_FEE')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'ACCOUNT_FEE'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-amber-600 mb-0.5">
                  account_balance
                </span>
                <span className="text-[11px] leading-tight">Account Fee (USDT)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('VPS_INFRA')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'VPS_INFRA'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600 mb-0.5">
                  dns
                </span>
                <span className="text-[11px] leading-tight">VPS / Servers</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('OTHER')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                  category === 'OTHER'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-purple-600 mb-0.5">
                  more_horiz
                </span>
                <span className="text-[11px] leading-tight">General / Misc</span>
              </button>
            </div>
          </div>

          {/* Contextual Linkage Boxes */}
          {category === 'PHONE_PACKAGE' && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-emerald-700">smartphone</span>
                  <span>Link to Trader Phone Device</span>
                </label>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                  Paid in PKR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                    Select Trader / Phone Slot
                  </label>
                  <select
                    value={selectedTraderId}
                    onChange={(e) => handleTraderChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Manual / Unassigned Phone --</option>
                    {traders.map((t) => (
                      <option key={t.id} value={t.id}>
                        Phone {t.assignedPhoneSlot}: {t.name} ({t.deviceName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                    Billing Month / Cycle
                  </label>
                  <input
                    type="text"
                    value={monthPeriod}
                    onChange={(e) => setMonthPeriod(e.target.value)}
                    placeholder="e.g. August 2026"
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'ACCOUNT_FEE' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-amber-700">account_balance</span>
                  <span>Link to Phase 1 Broker Account</span>
                </label>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                  Paid in USDT
                </span>
              </div>

              <div>
                <select
                  value={selectedAccountId}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Manual / New Phase 1 Account --</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} • {a.broker} ({a.phase}) • Phone {a.phone}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-700 mt-1">
                  * Note: Account fee is only paid once upon opening Phase 1 challenge accounts.
                </p>
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Expense Title / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Data SIM - Phone 1 (John Doe)"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Amount, Currency & Payer (Owner) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Amount and Currency */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Amount &amp; Currency <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 shadow-2xs">
                <span className="px-2.5 text-xs font-bold text-slate-400 select-none">
                  {currency === 'PKR' ? 'Rs' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="3500"
                  className="flex-1 py-2 px-1 text-sm font-mono font-bold text-slate-900 bg-transparent focus:outline-none min-w-0"
                />
                <div className="flex items-center border-l border-slate-200 bg-slate-100 p-0.5 m-1 rounded">
                  <button
                    type="button"
                    onClick={() => setCurrency('USDT')}
                    className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                      currency === 'USDT'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    USDT
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('PKR')}
                    className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                      currency === 'PKR'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    PKR
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1.5 font-mono">
                {currency === 'PKR' && `≈ ${(parseFloat(amount || '0') / 286).toFixed(2)} USDT (strict rate: 286 PKR = 1 USDT)`}
                {currency === 'USDT' && `≈ ${(parseFloat(amount || '0') * 286).toLocaleString()} PKR`}
              </span>
            </div>

            {/* Paid By (Owner) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Paid By (Owner) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 my-auto">
                <button
                  type="button"
                  onClick={() => setPaidBy('Ismail')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    paidBy === 'Ismail'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Ismail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy('Hamza')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    paidBy === 'Hamza'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Hamza</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1.5">
                Selected payer for partner settlement breakdown
              </span>
            </div>
          </div>

          {/* Date & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Payment Channel
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="JazzCash, Binance Pay, Bank"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                TXID / Ref (Optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="TXID or receipt #"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Notes / Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Package renewed before high volatility news event"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DEE2E6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-xs font-bold bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{editingExpense ? 'Update Expense' : 'Save Expense Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
