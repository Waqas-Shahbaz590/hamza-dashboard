import React, { useState } from 'react';
import { Account, AccountPhase } from '../../types';

interface AccountDetailModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSyncAccount: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
  onMarkBreached?: (accountId: string) => void;
  onMarkPassed?: (accountId: string) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  onSyncAccount,
  onDeleteAccount,
  onMarkBreached,
  onMarkPassed,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'breach' | 'pass' | 'delete' | null>(null);

  if (!isOpen || !account) return null;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onSyncAccount(account.id);
    }, 600);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const base = 10000;
  const balancePct = ((account.accountBalance - base) / base) * 100;
  const isEligibleForPass = account.phase === 'Phase 1' || account.phase === 'Phase 2';
  const isLive = account.phase === 'Live';
  const isOld = account.phase === 'Breached' || account.phase === 'Passed';

  const getUpgradePhaseName = (currPhase: AccountPhase) => {
    if (currPhase === 'Phase 1') return 'Phase 2';
    if (currPhase === 'Phase 2') return 'Live';
    return null;
  };

  const upgradedPhase = getUpgradePhaseName(account.phase);

  const renderPhaseBadge = (phase: AccountPhase) => {
    switch (phase) {
      case 'Live':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Account
          </span>
        );
      case 'Phase 1':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Phase 1 Account
          </span>
        );
      case 'Phase 2':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Phase 2 Account
          </span>
        );
      case 'Passed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="material-symbols-outlined text-[13px] text-teal-600">check_circle</span>
            Passed (Old Account)
          </span>
        );
      case 'Breached':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Breached (Old Account)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {phase}
          </span>
        );
    }
  };

  return (
    <div
      id="account-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="account-detail-modal-content"
        className="bg-white border border-[#DEE2E6] rounded w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1C1E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white p-0.5 shrink-0 overflow-hidden border border-slate-200">
              <img
                src={account.brokerLogo}
                alt={account.broker}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {account.accountName}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                {account.broker} • #{account.accountNumber}
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

        {/* Content Body */}
        <div className="p-4 space-y-3.5">
          {/* Current Balance / Equity Highlight */}
          <div className="bg-slate-50 p-3.5 rounded border border-[#DEE2E6] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Current Balance / Equity
              </p>
              <p className="text-xl font-bold text-slate-900 font-mono">
                {formatCurrency(account.accountBalance)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border ${
                    balancePct > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : balancePct < 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={`Calculated against base $10,000`}
                >
                  {balancePct > 0 ? `+${balancePct.toFixed(1)}%` : `${balancePct.toFixed(1)}%`} vs $10k
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                Account Phase
              </span>
              {renderPhaseBadge(account.phase)}
            </div>
          </div>

          {/* Account Metadata Details */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#DEE2E6]">
              <span className="text-slate-500">Designated Trader</span>
              <span className="text-slate-900 font-medium">{account.personName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#DEE2E6]">
              <span className="text-slate-500">Account Owner</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  (account.owner || 'Ismail') === 'Ismail'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {account.owner || 'Ismail'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#DEE2E6]">
              <span className="text-slate-500">Device</span>
              <span className="text-slate-900 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-slate-400">
                  smartphone
                </span>
                <span>Phone {account.phone || 1}</span>
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Node Connection</span>
              <span className="text-slate-900 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>ONLINE • Last synced {account.lastSync}</span>
              </span>
            </div>
          </div>

          {/* Confirm Banner if triggered */}
          {confirmAction === 'breach' && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 animate-in fade-in duration-150">
              <p className="font-bold mb-1">Mark this account as Breached?</p>
              <p className="text-[11px] text-rose-700 mb-2">
                This account will immediately move to the Old accounts section below.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onMarkBreached?.(account.id);
                    setConfirmAction(null);
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Yes, Mark Breached
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmAction === 'pass' && upgradedPhase && (
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded text-xs text-teal-900 animate-in fade-in duration-150">
              <p className="font-bold mb-1">Mark account as Passed?</p>
              <p className="text-[11px] text-teal-800 mb-2">
                This account will move to Old accounts as &quot;Passed&quot;, and a brand new{' '}
                <strong className="font-bold">{upgradedPhase}</strong> account for {account.accountName} with a fresh $10,000 balance will be instantly created!
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onMarkPassed?.(account.id);
                    setConfirmAction(null);
                    onClose();
                  }}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  <span>Yes, Pass &amp; Create {upgradedPhase}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="pt-2 border-t border-[#DEE2E6] flex flex-wrap items-center gap-2">
            {/* 1. Mark Passed Button (Only for Phase 1 & Phase 2 accounts; NOT Live) */}
            {isEligibleForPass && !confirmAction && (
              <button
                type="button"
                onClick={() => setConfirmAction('pass')}
                className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                title={`Mark this ${account.phase} account as Passed and auto-generate new ${upgradedPhase} account`}
              >
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>Mark Passed (→ {upgradedPhase})</span>
              </button>
            )}

            {/* 2. Mark Breached Button (Available for Live, Phase 1, Phase 2 unless already breached/passed) */}
            {!isOld && !confirmAction && (
              <button
                type="button"
                onClick={() => setConfirmAction('breach')}
                className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                title="Mark account breached (moves to Old accounts)"
              >
                <span className="material-symbols-outlined text-[15px] text-rose-600">block</span>
                <span>Mark Breached</span>
              </button>
            )}

            {/* If it's already an old/archived account */}
            {isOld && (
              <div className="flex-1 py-1.5 px-2.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-slate-400">history</span>
                <span>Archived in Old Accounts as {account.phase}</span>
              </div>
            )}

            {/* 3. Sync button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-[#DEE2E6] rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span className={`material-symbols-outlined text-[14px] ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* 4. Delete button */}
            <button
              type="button"
              onClick={() => {
                onDeleteAccount(account.id);
                onClose();
              }}
              className="py-1.5 px-2.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-[#DEE2E6] hover:border-rose-200 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
              title="Delete Account"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

