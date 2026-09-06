import React, { useState } from 'react';
import { Trader, Account } from '../types';

interface TradersViewProps {
  traders: Trader[];
  accounts: Account[];
  onOpenAddTrader: () => void;
  onEditTrader: (trader: Trader) => void;
  onDeleteTrader: (traderId: string) => void;
  onConnectAccountForTrader: (trader: Trader) => void;
}

export const TradersView: React.FC<TradersViewProps> = ({
  traders,
  accounts,
  onOpenAddTrader,
  onEditTrader,
  onDeleteTrader,
  onConnectAccountForTrader,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'ALL' | 'Ismail' | 'Hamza'>('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [traderToDelete, setTraderToDelete] = useState<Trader | null>(null);

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const filteredTraders = traders.filter((t) => {
    const matchesOwner = ownerFilter === 'ALL' || t.owner === ownerFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q) ||
      t.deviceName.toLowerCase().includes(q) ||
      `phone ${t.assignedPhoneSlot}`.toLowerCase().includes(q) ||
      (t.reddotPayId && t.reddotPayId.toLowerCase().includes(q)) ||
      (t.thriversId && t.thriversId.toLowerCase().includes(q)) ||
      (t.fundpipsId && t.fundpipsId.toLowerCase().includes(q));

    return matchesOwner && matchesSearch;
  });

  const ismailCount = traders.filter((t) => t.owner === 'Ismail').length;
  const hamzaCount = traders.filter((t) => t.owner === 'Hamza').length;

  return (
    <div id="traders-view-container" className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto overscroll-contain max-w-7xl mx-auto w-full space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded border border-[#DEE2E6]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Trader Profiles & Credentials Vault</h1>
              <p className="text-xs text-slate-500">
                Manage registered traders, hardware devices, Reddot Pay & broker credentials, and dashboard slot assignments.
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-add-new-trader"
          onClick={onOpenAddTrader}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Register New Trader</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Traders
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold font-mono text-slate-900">{traders.length}</span>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">badge</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block mb-0.5">
            Ismail&apos;s Team
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold font-mono text-blue-700">{ismailCount}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
              {traders.length > 0 ? Math.round((ismailCount / traders.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
            Hamza&apos;s Team
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold font-mono text-emerald-700">{hamzaCount}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              {traders.length > 0 ? Math.round((hamzaCount / traders.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Linked Broker Accounts
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold font-mono text-slate-900">{accounts.length}</span>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">account_balance_wallet</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded border border-[#DEE2E6] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search trader, device, phone slot, credentials ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Owner:</span>
          {(['ALL', 'Ismail', 'Hamza'] as const).map((owner) => (
            <button
              key={owner}
              onClick={() => setOwnerFilter(owner)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                ownerFilter === owner
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {owner === 'ALL' ? 'All Owners' : owner}
            </button>
          ))}
        </div>
      </div>

      {/* Traders List Table */}
      <div className="bg-white border border-[#DEE2E6] rounded overflow-hidden">
        <div className="p-3 px-4 border-b border-[#DEE2E6] bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-indigo-600">badge</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Registered Traders ({filteredTraders.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Slots are linked to dashboard &ldquo;Phone #&rdquo; view
          </span>
        </div>

        {filteredTraders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <span className="material-symbols-outlined text-slate-300 text-4xl block mb-2">person_off</span>
            <p className="font-semibold text-slate-700">No trader profiles found</p>
            <p className="mt-1">Try adjusting your search query or add a new trader profile.</p>
            <button
              onClick={onOpenAddTrader}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 cursor-pointer"
            >
              Add First Trader
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-white border-b border-[#DEE2E6] text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5]">Trader Profile</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5] text-center">Assigned Slot</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5]">Device Hardware</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5] text-center">Owner</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5]">Credentials & Vault</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5] text-center">Linked Accounts</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-xs">
                {filteredTraders.map((trader) => {
                  const linkedAccounts = accounts.filter(
                    (a) => a.accountName.toLowerCase() === trader.name.toLowerCase() || a.phone === trader.assignedPhoneSlot
                  );

                  const rdpKey = `${trader.id}-rdp`;
                  const thrKey = `${trader.id}-thr`;
                  const fndKey = `${trader.id}-fnd`;

                  return (
                    <tr key={trader.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Phone */}
                      <td className="px-4 py-3 border-r border-[#F1F3F5]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {trader.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{trader.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">call</span>
                              {trader.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Slot */}
                      <td className="px-4 py-3 border-r border-[#F1F3F5] text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="material-symbols-outlined text-[13px]">smartphone</span>
                          Phone {trader.assignedPhoneSlot}
                        </span>
                      </td>

                      {/* Device Hardware */}
                      <td className="px-4 py-3 border-r border-[#F1F3F5]">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <span className="material-symbols-outlined text-slate-400 text-[15px]">devices</span>
                          <span>{trader.deviceName}</span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3 border-r border-[#F1F3F5] text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            trader.owner === 'Ismail'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {trader.owner}
                        </span>
                      </td>

                      {/* Credentials Vault */}
                      <td className="px-4 py-3 border-r border-[#F1F3F5]">
                        <div className="space-y-1 text-[11px]">
                          {/* Reddot Pay */}
                          {trader.reddotPayId && (
                            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 px-2 rounded border border-slate-200/60 font-mono">
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 uppercase">
                                Reddot
                              </span>
                              <span className="text-slate-700 font-semibold">{trader.reddotPayId}</span>
                              {trader.reddotPayPassword && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <span className="text-slate-500">
                                    {visiblePasswords[rdpKey] ? trader.reddotPayPassword : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(rdpKey)}
                                    title={visiblePasswords[rdpKey] ? 'Hide password' : 'Show password'}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {visiblePasswords[rdpKey] ? 'visibility_off' : 'visibility'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(trader.reddotPayPassword || '', rdpKey)}
                                    title="Copy password"
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {copiedKey === rdpKey ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Thrivers */}
                          {trader.thriversId && (
                            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 px-2 rounded border border-slate-200/60 font-mono">
                              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 uppercase">
                                Thrivers
                              </span>
                              <span className="text-slate-700 font-semibold">{trader.thriversId}</span>
                              {trader.thriversPassword && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <span className="text-slate-500">
                                    {visiblePasswords[thrKey] ? trader.thriversPassword : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(thrKey)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {visiblePasswords[thrKey] ? 'visibility_off' : 'visibility'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(trader.thriversPassword || '', thrKey)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {copiedKey === thrKey ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fundpips */}
                          {trader.fundpipsId && (
                            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 px-2 rounded border border-slate-200/60 font-mono">
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 uppercase">
                                Fundpips
                              </span>
                              <span className="text-slate-700 font-semibold">{trader.fundpipsId}</span>
                              {trader.fundpipsPassword && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <span className="text-slate-500">
                                    {visiblePasswords[fndKey] ? trader.fundpipsPassword : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(fndKey)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {visiblePasswords[fndKey] ? 'visibility_off' : 'visibility'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(trader.fundpipsPassword || '', fndKey)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      {copiedKey === fndKey ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {!trader.reddotPayId && !trader.thriversId && !trader.fundpipsId && (
                            <span className="text-slate-400 italic">No credentials saved</span>
                          )}
                        </div>
                      </td>

                      {/* Linked Accounts */}
                      <td className="px-4 py-3 border-r border-[#F1F3F5] text-center">
                        {linkedAccounts.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {linkedAccounts.length} Connected
                            </span>
                            <div className="flex items-center gap-1">
                              {linkedAccounts.map((acc) => (
                                <span
                                  key={acc.id}
                                  className={`text-[9px] font-bold px-1 rounded ${
                                    acc.broker === 'Thrivers'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {acc.broker}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 Accounts</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onConnectAccountForTrader(trader)}
                            title="Add Broker Account for this Trader"
                            className="p-1 px-2 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[13px]">add</span>
                            <span>Add Account</span>
                          </button>
                          <button
                            onClick={() => onEditTrader(trader)}
                            title="Edit Profile & Credentials"
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => setTraderToDelete(trader)}
                            title="Delete Trader"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Delete Trader Confirmation */}
      {traderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-700">
                <span className="material-symbols-outlined text-[20px]">person_remove</span>
                <h3 className="font-bold text-sm text-slate-900">Delete Trader Profile</h3>
              </div>
              <button
                onClick={() => setTraderToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove the trader profile for <strong className="text-slate-900">{traderToDelete.name}</strong>?
              </p>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div><span className="text-slate-500">Device:</span> <strong className="text-slate-800">{traderToDelete.deviceName} (Phone {traderToDelete.assignedPhoneSlot})</strong></div>
                <div><span className="text-slate-500">Assigned Owner:</span> <strong className="text-slate-800">{traderToDelete.owner}</strong></div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTraderToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTrader(traderToDelete.id);
                  setTraderToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Yes, Delete Trader</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
