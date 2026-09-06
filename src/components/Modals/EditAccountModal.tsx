import React, { useState, useEffect } from 'react';
import { Account, BrokerName, AccountPhase, AccountOwner } from '../../types';
import { BROKER_LOGOS } from '../../data/mockData';

interface EditAccountModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAccount: (updatedAccount: Account) => void;
  onDeleteAccount?: (accountId: string) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  const [accountName, setAccountName] = useState('');
  const [broker, setBroker] = useState<BrokerName>('Yahoodi');
  const [personName, setPersonName] = useState('');
  const [owner, setOwner] = useState<AccountOwner>('Ismail');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountBalance, setAccountBalance] = useState('10000');
  const [phase, setPhase] = useState<AccountPhase>('Live');
  const [phone, setPhone] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (account) {
      setAccountName(account.accountName);
      setBroker(account.broker);
      setPersonName(account.personName);
      setOwner(account.owner || 'Ismail');
      setAccountNumber(account.accountNumber);
      setAccountBalance(account.accountBalance.toString());
      setPhase(account.phase);
      setPhone(account.phone || 1);
      setConfirmDelete(false);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  // Percentage calculated against base 10,000
  const balanceNum = parseFloat(accountBalance) || 0;
  const base = 10000;
  const balancePct = ((balanceNum - base) / base) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const traderName = personName.trim() || accountName.trim() || account.personName;
    if (!traderName) {
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const updated: Account = {
        ...account,
        accountName: traderName,
        broker,
        brokerLogo: BROKER_LOGOS[broker] || account.brokerLogo,
        personName: traderName,
        owner,
        accountNumber: accountNumber.trim() || account.accountNumber,
        accountBalance: balanceNum,
        equity: balanceNum * (phase === 'Live' ? 1.25 : 1.0),
        phase,
        phone,
        lastSync: 'Just updated',
      };

      onUpdateAccount(updated);
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <div
      id="edit-account-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="edit-account-modal-content"
        className="bg-white border border-[#DEE2E6] rounded w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1C1E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[16px]">tune</span>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Update Account Info
              </h3>
              <p className="text-[10px] text-slate-500">
                Edit balance, execution phase, designated phone, and credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Broker Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Broker Institution
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Thrivers', 'Fundpips'] as BrokerName[]).map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBroker(b)}
                  className={`p-2.5 rounded border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    broker === b
                      ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                      : 'bg-slate-50 border-[#DEE2E6] hover:bg-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded bg-white p-0.5 shrink-0 overflow-hidden border border-slate-200">
                    <img
                      src={BROKER_LOGOS[b]}
                      alt={b}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{b}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trader Name, Owner & Account Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Designated Trader
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hamza Shahbaz"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setAccountName(e.target.value);
                }}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Account Owner
              </label>
              <div className="flex gap-1.5">
                {(['Ismail', 'Hamza'] as AccountOwner[]).map((o) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => setOwner(o)}
                    className={`flex-1 py-1.5 rounded text-xs font-bold transition-all cursor-pointer text-center ${
                      owner === o
                        ? o === 'Ismail'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300 ring-1 ring-purple-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300 ring-1 ring-blue-300'
                        : 'bg-slate-50 border border-[#DEE2E6] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{o}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Balance ($) and Computed Base-10k % */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Account Balance ($ USD)
              </label>
              <span
                className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                  balancePct > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : balancePct < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {balancePct > 0 ? `+${balancePct.toFixed(1)}%` : `${balancePct.toFixed(1)}%`} (Base $10k)
              </span>
            </div>
            <input
              type="number"
              step="any"
              required
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 font-bold"
            />
            <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1">
              <span>Base: $10,000. Targets: P1 ≥ $10,800 (+8%) • P2 ≥ $10,500 (+5%) • Breach ≤ $9,000 (-10%)</span>
            </div>

            {/* Dynamic Rule Preview Callout */}
            {balanceNum <= 9000 && phase !== 'Breached' && phase !== 'Passed' && (
              <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-rose-600 shrink-0">warning</span>
                <span>
                  <strong>Drawdown Limit (≤ $9,000 / -10%):</strong> Saving will automatically mark this account as <strong>Breached</strong> and move it to Old Accounts.
                </span>
              </div>
            )}

            {balanceNum >= 10800 && phase === 'Phase 1' && (
              <div className="mt-2 p-2 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[11px] flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-teal-600 shrink-0">verified</span>
                <span>
                  <strong>Target Reached (≥ $10,800 / +8%):</strong> Saving will mark Phase 1 as <strong>Passed</strong> and automatically generate a new <strong>Phase 2</strong> account ($10,000 baseline).
                </span>
              </div>
            )}

            {balanceNum >= 10500 && phase === 'Phase 2' && (
              <div className="mt-2 p-2 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[11px] flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[15px] text-teal-600 shrink-0">rocket_launch</span>
                <span>
                  <strong>Target Reached (≥ $10,500 / +5%):</strong> Saving will mark Phase 2 as <strong>Passed</strong> and automatically generate a new <strong>Live funded</strong> account ($10,000 baseline).
                </span>
              </div>
            )}
          </div>

          {/* Phase (Live, Phase 1, Phase 2, Breached) & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Execution Phase
              </label>
              <div className="flex gap-1 flex-wrap">
                {(['Live', 'Phase 1', 'Phase 2', 'Passed', 'Breached'] as AccountPhase[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPhase(p)}
                    className={`flex-1 min-w-[50px] py-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      phase === p
                        ? p === 'Live'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-1 ring-emerald-300'
                          : p === 'Phase 1'
                          ? 'bg-blue-50 text-blue-700 border border-blue-300 ring-1 ring-blue-300'
                          : p === 'Phase 2'
                          ? 'bg-amber-50 text-amber-700 border border-amber-300 ring-1 ring-amber-300'
                          : p === 'Passed'
                          ? 'bg-teal-50 text-teal-700 border border-teal-300 ring-1 ring-teal-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-300 ring-1 ring-rose-300'
                        : 'bg-slate-50 border border-[#DEE2E6] text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Device (1–10)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">#</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={phone}
                    onChange={(e) => setPhone(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-14 bg-white border border-[#DEE2E6] rounded px-1.5 py-0.5 text-xs text-center font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setPhone(num)}
                    className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                      phone === num
                        ? 'bg-blue-50 text-blue-700 border border-blue-300 ring-1 ring-blue-300'
                        : 'bg-slate-50 border border-[#DEE2E6] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[11px] text-slate-400">devices</span>
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit / Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#DEE2E6]">
            {onDeleteAccount ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded p-1">
                  <span className="text-[10px] text-rose-700 font-bold px-1">Confirm delete?</span>
                  <button
                    type="button"
                    id="btn-confirm-modal-delete"
                    onClick={() => {
                      onDeleteAccount(account.id);
                      onClose();
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-modal-delete-account"
                  onClick={() => setConfirmDelete(true)}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  <span>Disconnect Account</span>
                </button>
              )
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#DEE2E6] text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">save</span>
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
