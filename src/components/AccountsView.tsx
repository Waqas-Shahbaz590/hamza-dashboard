import React, { useState, useMemo } from 'react';
import { Account } from '../types';
import { EditAccountModal } from './Modals/EditAccountModal';

interface AccountsViewProps {
  accounts: Account[];
  searchQuery: string;
  onOpenConnectModal: () => void;
  onSyncAllAccounts: () => void;
  onDeleteAccount: (accountId: string) => void;
  onUpdateAccount: (updatedAccount: Account) => void;
  onSyncAccount: (accountId: string) => void;
  isSyncingAll: boolean;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  searchQuery,
  onOpenConnectModal,
  onSyncAllAccounts,
  onDeleteAccount,
  onUpdateAccount,
  onSyncAccount,
  isSyncingAll,
}) => {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // Base 10,000 percentage calculation
  const getBase10kPercentage = (balance: number) => {
    const base = 10000;
    const pct = ((balance - base) / base) * 100;
    return pct;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Filter accounts if global search query exists
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.broker.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        a.personName.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  return (
    <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E] flex flex-col gap-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-4 rounded border border-[#DEE2E6]">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-blue-600 text-[20px]">account_balance_wallet</span>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Broker Accounts
          </h1>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {filteredAccounts.length} Connected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-sync-all-accounts"
            onClick={onSyncAllAccounts}
            disabled={isSyncingAll}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#DEE2E6] px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[15px] text-blue-600 ${
                isSyncingAll ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>{isSyncingAll ? 'Syncing...' : 'Sync All'}</span>
          </button>

          <button
            id="btn-add-account-accounts-view"
            onClick={onOpenConnectModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>New Account</span>
          </button>
        </div>
      </div>

      {/* Accounts Management Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-slate-400">tune</span>
            <span>Active Accounts ({filteredAccounts.length})</span>
          </h2>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="bg-white rounded border border-[#DEE2E6] p-8 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">account_balance_wallet</span>
            <h3 className="text-sm font-bold text-slate-800">No Accounts Connected</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Get started by connecting your first broker account to track equity, pair hedges, and manage trader allocations.
            </p>
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Connect First Broker</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAccounts.map((account) => {
            const pct = getBase10kPercentage(account.accountBalance);
            const pctText = pct > 0 
              ? `+${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%` 
              : `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;

            return (
              <div
                key={account.id}
                id={`account-card-manage-${account.id}`}
                className="bg-white rounded border border-[#DEE2E6] hover:border-slate-300 p-4 transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Trader Name, Broker & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#F1F3F5] pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center p-1 overflow-hidden border border-[#DEE2E6] shrink-0">
                        <img
                          src={account.brokerLogo}
                          alt={account.broker}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                          {account.accountName}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-sans">
                          {account.broker} • <span className="font-mono text-slate-400">#{account.accountNumber}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {account.phase === 'Live' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
                      {account.phase === 'Phase 1' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Phase 1
                        </span>
                      )}
                      {account.phase === 'Phase 2' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Phase 2
                        </span>
                      )}
                      {account.phase === 'Breached' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Breached
                        </span>
                      )}
                      {account.phase === 'Passed' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <span className="material-symbols-outlined text-[12px] text-teal-600">check_circle</span>
                          Passed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Metrics: Balance with Base 10k return */}
                  <div className="bg-slate-50 border border-[#DEE2E6] rounded p-2.5 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none mb-1">
                        Account Balance
                      </span>
                      <div className="text-base font-bold font-mono text-slate-900 leading-tight">
                        {formatCurrency(account.accountBalance)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none mb-1">
                        Return vs $10k
                      </span>
                      <span
                        className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded border inline-block ${
                          pct > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : pct < 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {pctText}
                      </span>
                    </div>
                  </div>

                  {/* Account Properties: Owner, Device & Status */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                    <div className="flex justify-between items-center py-0.5 border-b border-[#F8F9FA]">
                      <span className="text-slate-400 text-[11px]">Owner:</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          (account.owner || 'Ismail') === 'Ismail'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {account.owner || 'Ismail'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-[#F8F9FA]">
                      <span className="text-slate-400 text-[11px]">Device:</span>
                      <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">smartphone</span>
                        <span>Phone {account.phone || 1}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-[#F8F9FA]">
                      <span className="text-slate-400 text-[11px]">Connection Status:</span>
                      <span className="font-semibold text-emerald-600 text-[11px] inline-flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Online • {account.lastSync}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions (Update Info, Sync, Delete) */}
                <div className="flex items-center gap-1.5 pt-2.5 border-t border-[#DEE2E6]">
                  <button
                    id={`btn-edit-account-${account.id}`}
                    onClick={() => setEditingAccount(account)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-1.5 px-2 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px] text-slate-600">edit</span>
                    <span>Update Info</span>
                  </button>

                  <button
                    id={`btn-sync-node-${account.id}`}
                    onClick={() => onSyncAccount(account.id)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-[#DEE2E6] rounded transition-colors cursor-pointer"
                    title="Sync Node"
                  >
                    <span className="material-symbols-outlined text-[15px]">sync</span>
                  </button>

                  <button
                    id={`btn-delete-account-${account.id}`}
                    onClick={() => setAccountToDelete(account)}
                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-[#DEE2E6] hover:border-rose-200 rounded transition-colors cursor-pointer"
                    title="Disconnect Broker Account"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Edit Account Modal */}
      <EditAccountModal
        account={editingAccount}
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onUpdateAccount={onUpdateAccount}
        onDeleteAccount={onDeleteAccount}
      />

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div
          id="delete-account-confirm-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setAccountToDelete(null)}
        >
          <div
            id="delete-account-confirm-modal"
            className="bg-white border border-[#DEE2E6] rounded w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 text-[#1A1C1E] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Disconnect Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to disconnect <strong className="text-slate-800">{accountToDelete.accountName}</strong> ({accountToDelete.broker} #{accountToDelete.accountNumber})?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#DEE2E6]">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#DEE2E6] text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-account"
                onClick={() => {
                  onDeleteAccount(accountToDelete.id);
                  setAccountToDelete(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
