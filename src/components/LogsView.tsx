import React, { useState, useMemo } from 'react';
import { AppLogEntry, LogActionType } from '../types';

interface LogsViewProps {
  logs: AppLogEntry[];
  onClearLogs: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Filter logs by type and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Type filter
      if (filterType !== 'ALL') {
        if (log.actionType !== filterType) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTrader = log.traderName.toLowerCase().includes(q);
        const matchesBroker = log.broker.toLowerCase().includes(q);
        const matchesSummary = log.summary.toLowerCase().includes(q);
        const matchesAccountNum = log.accountNumber?.toLowerCase().includes(q);
        return matchesTrader || matchesBroker || matchesSummary || matchesAccountNum;
      }

      return true;
    });
  }, [logs, filterType, searchQuery]);

  // Summary counts
  const stats = useMemo(() => {
    const total = logs.length;
    const added = logs.filter((l) => l.actionType === 'ACCOUNT_ADDED').length;
    const balanceChanges = logs.filter((l) => l.actionType === 'BALANCE_CHANGED').length;
    const updates = logs.filter((l) => l.actionType === 'ACCOUNT_UPDATED').length;
    return { total, added, balanceChanges, updates };
  }, [logs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Trader', 'Broker', 'Account #', 'Summary'];
    const rows = logs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.title}"`,
      `"${l.traderName}"`,
      `"${l.broker}"`,
      `"${l.accountNumber || ''}"`,
      `"${l.summary.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activity_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (type: LogActionType) => {
    switch (type) {
      case 'ACCOUNT_ADDED':
        return {
          icon: 'person_add',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Account Added',
        };
      case 'BALANCE_CHANGED':
        return {
          icon: 'price_change',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Balance Adjusted',
        };
      case 'ACCOUNT_UPDATED':
        return {
          icon: 'edit_note',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Account Edited',
        };
      case 'ACCOUNT_DELETED':
        return {
          icon: 'link_off',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Disconnected',
        };
      default:
        return {
          icon: 'info',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          label: 'Activity',
        };
    }
  };

  return (
    <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E] flex flex-col gap-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-4 rounded border border-[#DEE2E6]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Activity Logs</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {logs.length} Entries
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clean history of account additions, balance changes, and profile edits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-logs-csv"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#DEE2E6] px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-600">download</span>
            <span>Export CSV</span>
          </button>

          {logs.length > 0 && (
            <button
              id="btn-clear-logs"
              onClick={() => setIsConfirmClearOpen(true)}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Total Logged Events
          </span>
          <span className="text-xl font-bold font-mono text-slate-800">{stats.total}</span>
        </div>
        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Accounts Added
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600">+{stats.added}</span>
        </div>
        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Balance Adjustments
          </span>
          <span className="text-xl font-bold font-mono text-blue-600">{stats.balanceChanges}</span>
        </div>
        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Profile &amp; Details Edited
          </span>
          <span className="text-xl font-bold font-mono text-amber-600">{stats.updates}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded border border-[#DEE2E6]">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Activities', count: logs.length },
            { id: 'ACCOUNT_ADDED', label: 'Accounts Added', count: stats.added },
            { id: 'BALANCE_CHANGED', label: 'Balance Edits', count: stats.balanceChanges },
            { id: 'ACCOUNT_UPDATED', label: 'Profile Edits', count: stats.updates },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                filterType === pill.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  filterType === pill.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by trader, broker, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-[#DEE2E6] rounded pl-8 pr-3 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Logs Feed Container */}
      <div className="bg-white rounded border border-[#DEE2E6]">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-[36px] text-slate-300">history</span>
            <p className="text-sm font-semibold text-slate-600">No activity logs found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchQuery
                ? `No entries match "${searchQuery}". Try clearing your search query.`
                : 'Account additions, balance edits, and profile updates will appear here in chronological order.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F3F5]">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.actionType);

              return (
                <div
                  key={log.id}
                  id={`log-entry-${log.id}`}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4"
                >
                  {/* Left: Action Icon Badge */}
                  <div className="flex items-center sm:items-start gap-2.5 shrink-0">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center border shrink-0 ${badge.bg}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{badge.icon}</span>
                    </div>

                    <div className="sm:hidden flex-1 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                  </div>

                  {/* Center: Details & Context */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Trader Name */}
                      <span className="text-sm font-bold text-slate-900 tracking-tight">
                        {log.traderName}
                      </span>

                      {/* Broker Badge */}
                      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                        <img
                          src={log.brokerLogo}
                          alt={log.broker}
                          className="w-3.5 h-3.5 object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[11px] font-semibold text-slate-700">{log.broker}</span>
                      </div>

                      {/* Account Number */}
                      {log.accountNumber && (
                        <span className="text-[11px] font-mono text-slate-400">
                          ({log.accountNumber})
                        </span>
                      )}

                      {/* Desktop Action Badge */}
                      <span
                        className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.2 rounded border items-center gap-1 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Summary text */}
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {log.summary}
                    </p>

                    {/* Specific Field Changes Comparison Chips */}
                    {log.changes && log.changes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {log.changes.map((change, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 border border-[#DEE2E6] rounded px-2 py-0.5 text-[11px] flex items-center gap-1 font-mono text-slate-700"
                          >
                            <span className="text-slate-400 font-sans font-bold text-[10px] uppercase">
                              {change.field}:
                            </span>
                            <span className="text-slate-500 line-through">{String(change.from)}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-blue-700">{String(change.to)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Timestamp */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
                    <span className="text-xs font-semibold text-slate-700 font-mono">
                      {log.timestamp}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.timeAgo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Clear Modal */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-white rounded border border-[#DEE2E6] max-w-sm w-full p-4.5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <span>Clear Activity Logs?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete all {logs.length} activity history entries from your session storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearLogs();
                  setIsConfirmClearOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
