import React, { useState, useRef, useEffect } from 'react';
import { Account, AccountHedgeStatus, PlannedHedge, ActiveHedge } from '../types';

interface DashboardViewProps {
  accounts: Account[];
  plannedHedges?: PlannedHedge[];
  activeHedges?: ActiveHedge[];
  onUpdateAccountHedgeStatus?: (accountId: string, newStatus: AccountHedgeStatus | 'Auto') => void;
  onViewAllAccounts: () => void;
  onSelectAccount: (account: Account) => void;
  onOpenQuickTrade: () => void;
  onOpenConnectModal: () => void;
  onPlanHedgeWithAccount?: (account: Account) => void;
  onNavigateToHedges?: () => void;
  onNavigateToTraders?: () => void;
  activeHedgesCount?: number;
  plannedHedgesCount?: number;
  tradersCount?: number;
}

type SortField =
  | 'broker'
  | 'phase'
  | 'balance'
  | 'device'
  | 'owner'
  | 'trader'
  | 'hedgeStatus'
  | null;
type SortDirection = 'asc' | 'desc';

export const getAccountHedgeStatus = (
  account: Account,
  plannedHedges: PlannedHedge[] = [],
  activeHedges: ActiveHedge[] = []
): { status: AccountHedgeStatus; isOverridden: boolean; reason: string } => {
  if (account.hedgeStatusOverride && account.hedgeStatusOverride !== 'Auto') {
    return {
      status: account.hedgeStatusOverride,
      isOverridden: true,
      reason: `Manually set to "${account.hedgeStatusOverride}"`,
    };
  }

  // Rule 1: Criteria for Kachra - balance < $9,200 (less than 8% loss from 10k baseline) or Breached phase.
  // Takes precedence over planned hedge!
  if (account.accountBalance < 9200 || account.phase === 'Breached') {
    return {
      status: 'Kachra',
      isOverridden: false,
      reason: 'Balance is under $9,200 (< -8.0% loss)',
    };
  }

  // Rule 2: Active Running Hedge
  const isRunning = activeHedges.some(
    (h) => h.account1Id === account.id || h.account2Id === account.id
  );
  if (isRunning) {
    return {
      status: 'Running',
      isOverridden: false,
      reason: 'Active live hedge in progress',
    };
  }

  // Rule 3: Planned Hedge for tomorrow
  const isPlanned = plannedHedges.some(
    (h) => h.account1Id === account.id || h.account2Id === account.id
  );
  if (isPlanned) {
    return {
      status: 'Hedge Tomorrow',
      isOverridden: false,
      reason: 'Planned hedge queued for tomorrow',
    };
  }

  // Rule 4: Otherwise On Hold
  return {
    status: 'On Hold',
    isOverridden: false,
    reason: 'No active or planned hedge scheduled',
  };
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  plannedHedges = [],
  activeHedges = [],
  onUpdateAccountHedgeStatus,
  onViewAllAccounts,
  onSelectAccount,
  onOpenConnectModal,
  onPlanHedgeWithAccount,
  onNavigateToHedges,
  onNavigateToTraders,
  activeHedgesCount = 0,
  plannedHedgesCount = 0,
  tradersCount = 0,
}) => {
  // Filtering & Sorting state across headers
  const [brokerFilter, setBrokerFilter] = useState<string>('ALL');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<string>('ALL'); // 'ALL' | 'PROFIT' | 'DRAWDOWN'
  const [hedgeStatusFilter, setHedgeStatusFilter] = useState<string>('ALL');
  const [traderFilter, setTraderFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Active header dropdown state
  const [openHeaderDropdown, setOpenHeaderDropdown] = useState<string | null>(null);
  const [openOverrideAccountId, setOpenOverrideAccountId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const rowDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenHeaderDropdown(null);
      }
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(event.target as Node)) {
        setOpenOverrideAccountId(null);
      }
    };
    if (openHeaderDropdown || openOverrideAccountId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openHeaderDropdown, openOverrideAccountId]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters =
    brokerFilter !== 'ALL' ||
    phaseFilter !== 'ALL' ||
    deviceFilter !== 'ALL' ||
    ownerFilter !== 'ALL' ||
    balanceFilter !== 'ALL' ||
    hedgeStatusFilter !== 'ALL' ||
    traderFilter.trim() !== '' ||
    sortField !== null;

  const resetAllFilters = () => {
    setBrokerFilter('ALL');
    setPhaseFilter('ALL');
    setDeviceFilter('ALL');
    setOwnerFilter('ALL');
    setBalanceFilter('ALL');
    setHedgeStatusFilter('ALL');
    setTraderFilter('');
    setSortField(null);
    setSortDirection('asc');
    setOpenHeaderDropdown(null);
    setOpenOverrideAccountId(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Base 10,000 percentage calculation
  const getBase10kPercentage = (balance: number) => {
    const base = 10000;
    const pct = ((balance - base) / base) * 100;
    return pct;
  };

  const rawCurrentAccounts = accounts.filter((a) => a.phase !== 'Breached' && a.phase !== 'Passed');
  const oldAccounts = accounts.filter((a) => a.phase === 'Breached' || a.phase === 'Passed');

  // Distinct phone slots for filtering
  const distinctPhoneSlots: number[] = Array.from<number>(
    new Set(rawCurrentAccounts.map((a) => a.phone || 1))
  ).sort((a, b) => a - b);

  // Apply filters
  let filteredCurrentAccounts = rawCurrentAccounts.filter((a) => {
    if (brokerFilter !== 'ALL' && a.broker !== brokerFilter) return false;
    if (phaseFilter !== 'ALL' && a.phase !== phaseFilter) return false;
    if (deviceFilter !== 'ALL' && (a.phone || 1) !== parseInt(deviceFilter, 10)) return false;
    if (ownerFilter !== 'ALL' && (a.owner || 'Ismail') !== ownerFilter) return false;
    if (balanceFilter === 'PROFIT' && a.accountBalance <= 10000) return false;
    if (balanceFilter === 'DRAWDOWN' && a.accountBalance >= 10000) return false;
    if (hedgeStatusFilter !== 'ALL') {
      const { status } = getAccountHedgeStatus(a, plannedHedges, activeHedges);
      if (status !== hedgeStatusFilter) return false;
    }
    if (
      traderFilter.trim() &&
      !a.accountName.toLowerCase().includes(traderFilter.toLowerCase()) &&
      !a.accountNumber.toLowerCase().includes(traderFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Apply sorting
  if (sortField) {
    filteredCurrentAccounts = [...filteredCurrentAccounts].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'broker':
          comparison = a.broker.localeCompare(b.broker);
          break;
        case 'phase':
          comparison = a.phase.localeCompare(b.phase);
          break;
        case 'balance':
          comparison = a.accountBalance - b.accountBalance;
          break;
        case 'device':
          comparison = (a.phone || 1) - (b.phone || 1);
          break;
        case 'owner':
          comparison = (a.owner || 'Ismail').localeCompare(b.owner || 'Ismail');
          break;
        case 'trader':
          comparison = a.accountName.localeCompare(b.accountName);
          break;
        case 'hedgeStatus': {
          const statusA = getAccountHedgeStatus(a, plannedHedges, activeHedges).status;
          const statusB = getAccountHedgeStatus(b, plannedHedges, activeHedges).status;
          comparison = statusA.localeCompare(statusB);
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  const currentAccounts = filteredCurrentAccounts;

  const thriversCount = rawCurrentAccounts.filter((a) => a.broker === 'Thrivers').length;
  const fundpipsCount = rawCurrentAccounts.filter((a) => a.broker === 'Fundpips').length;
  const liveCount = rawCurrentAccounts.filter((a) => a.phase === 'Live').length;

  const renderStatusBadge = (phase: string) => {
    if (phase === 'Live') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      );
    }
    if (phase === 'Phase 1') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          Phase 1
        </span>
      );
    }
    if (phase === 'Phase 2') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Phase 2
        </span>
      );
    }
    if (phase === 'Breached') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Breached
        </span>
      );
    }
    if (phase === 'Passed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <span className="material-symbols-outlined text-[12px] text-teal-600">check_circle</span>
          Passed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {phase}
      </span>
    );
  };

  const renderHedgeStatusCell = (account: Account) => {
    const { status, isOverridden, reason } = getAccountHedgeStatus(
      account,
      plannedHedges,
      activeHedges
    );
    const isOpen = openOverrideAccountId === account.id;

    const getStatusBadgeClasses = () => {
      switch (status) {
        case 'Hedge Tomorrow':
          return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/90';
        case 'Running':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/90';
        case 'Kachra':
          return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/90';
        case 'On Hold':
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/90';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'Hedge Tomorrow':
          return 'schedule';
        case 'Running':
          return 'bolt';
        case 'Kachra':
          return 'delete_sweep';
        case 'On Hold':
        default:
          return 'pause_circle';
      }
    };

    return (
      <div
        className="relative inline-block text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenOverrideAccountId(isOpen ? null : account.id);
          }}
          title={`${status} • ${reason}. Click to change status or reset to auto.`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer shadow-2xs ${getStatusBadgeClasses()}`}
        >
          {status === 'Running' ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          ) : (
            <span className="material-symbols-outlined text-[13px] shrink-0">
              {getStatusIcon()}
            </span>
          )}
          <span className="truncate">{status}</span>
          {isOverridden && (
            <span
              className="text-[9px] px-1 py-0 rounded bg-slate-200/80 text-slate-700 font-mono tracking-tighter"
              title="Manually Overridden"
            >
              Manual
            </span>
          )}
          <span className="material-symbols-outlined text-[12px] opacity-60 ml-0.5">
            arrow_drop_down
          </span>
        </button>

        {/* Override Dropdown Popover */}
        {isOpen && (
          <div
            ref={rowDropdownRef}
            className="absolute left-0 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-xl z-40 p-1.5 w-48 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
              <span>Set Status: {account.accountName}</span>
            </div>

            <div className="py-1 space-y-0.5">
              {/* Option 1: Hedge Tomorrow */}
              <button
                type="button"
                onClick={() => {
                  onUpdateAccountHedgeStatus?.(account.id, 'Hedge Tomorrow');
                  setOpenOverrideAccountId(null);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  status === 'Hedge Tomorrow' && isOverridden
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-blue-600">schedule</span>
                  <span>Hedge Tomorrow</span>
                </div>
                {status === 'Hedge Tomorrow' && isOverridden && (
                  <span className="material-symbols-outlined text-[14px] text-blue-600">check</span>
                )}
              </button>

              {/* Option 2: On Hold */}
              <button
                type="button"
                onClick={() => {
                  onUpdateAccountHedgeStatus?.(account.id, 'On Hold');
                  setOpenOverrideAccountId(null);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  status === 'On Hold' && isOverridden
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">pause_circle</span>
                  <span>On Hold</span>
                </div>
                {status === 'On Hold' && isOverridden && (
                  <span className="material-symbols-outlined text-[14px] text-slate-600">check</span>
                )}
              </button>

              {/* Option 3: Kachra */}
              <button
                type="button"
                onClick={() => {
                  onUpdateAccountHedgeStatus?.(account.id, 'Kachra');
                  setOpenOverrideAccountId(null);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  status === 'Kachra' && isOverridden
                    ? 'bg-rose-50 text-rose-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-rose-500">delete_sweep</span>
                  <div>
                    <span className="font-semibold text-rose-700">Kachra</span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">&lt; $9,200 (&gt; 8% loss)</span>
                  </div>
                </div>
                {status === 'Kachra' && isOverridden && (
                  <span className="material-symbols-outlined text-[14px] text-rose-600">check</span>
                )}
              </button>

              {/* Option 4: Running */}
              <button
                type="button"
                onClick={() => {
                  onUpdateAccountHedgeStatus?.(account.id, 'Running');
                  setOpenOverrideAccountId(null);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  status === 'Running' && isOverridden
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">bolt</span>
                  <span>Running</span>
                </div>
                {status === 'Running' && isOverridden && (
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">check</span>
                )}
              </button>
            </div>

            {/* Reset to Auto */}
            <div className="border-t border-slate-100 pt-1 mt-1">
              <button
                type="button"
                onClick={() => {
                  onUpdateAccountHedgeStatus?.(account.id, 'Auto');
                  setOpenOverrideAccountId(null);
                }}
                className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                  !isOverridden
                    ? 'text-blue-600 font-semibold bg-blue-50/60'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">refresh</span>
                  <span>Reset to Auto (Calculated)</span>
                </div>
                {!isOverridden && (
                  <span className="text-[10px] text-blue-600 font-bold">Auto</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAccountRow = (account: Account, isCurrent: boolean = true) => {
    const pct = getBase10kPercentage(account.accountBalance);
    const pctText =
      pct > 0
        ? `+${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`
        : `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;

    return (
      <tr
        key={account.id}
        id={`dashboard-row-${account.id}`}
        onClick={() => onSelectAccount(account)}
        className="data-table-row transition-colors cursor-pointer hover:bg-slate-50 group"
      >
        {/* 1. Broker */}
        <td className="px-4 py-2.5 font-sans text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center shrink-0 p-0.5 overflow-hidden border border-[#DEE2E6]">
              <img
                src={account.brokerLogo}
                alt={account.broker}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="truncate font-semibold text-slate-800">{account.broker}</span>
          </div>
        </td>

        {/* 2. Status */}
        <td className="px-4 py-2.5 text-center">
          {renderStatusBadge(account.phase)}
        </td>

        {/* 3. Balance with % on base of 10,000 */}
        <td className="px-4 py-2.5 font-mono text-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">
              {formatCurrency(account.accountBalance)}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                pct > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : pct < 0
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={`Calculated against base of $10,000 (${pctText})`}
            >
              {pctText}
            </span>
          </div>
        </td>

        {/* 4. Device */}
        <td className="px-4 py-2.5 text-center font-sans">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
            <span className="material-symbols-outlined text-[13px] text-slate-400">smartphone</span>
            <span>Phone {account.phone || 1}</span>
          </span>
        </td>

        {/* 5. Owner */}
        <td className="px-4 py-2.5 text-center font-sans">
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${
              (account.owner || 'Ismail') === 'Ismail'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {account.owner || 'Ismail'}
          </span>
        </td>

        {/* 6. Trader */}
        <td className="px-4 py-2.5 font-sans font-medium text-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">{account.accountName}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({account.accountNumber})
            </span>
          </div>
        </td>

        {/* 7. Hedge Status */}
        <td className="px-3.5 py-2.5 font-sans relative">
          {renderHedgeStatusCell(account)}
        </td>

        {/* 8. Quick Hedge Action (For Active/Current accounts) */}
        {isCurrent && onPlanHedgeWithAccount && (
          <td className="px-3 py-2.5 text-right font-sans">
            <button
              title={`Plan a hedge trade starting with ${account.accountName}`}
              onClick={(e) => {
                e.stopPropagation();
                onPlanHedgeWithAccount(account);
              }}
              className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[12px]">swap_horiz</span>
              <span>Hedge</span>
            </button>
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E]">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              CURRENT ACCOUNTS
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{currentAccounts.length}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Active
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Thrivers Accounts
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{thriversCount}</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Fundpips Accounts
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{fundpipsCount}</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded border border-[#DEE2E6]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              LIVE ACCOUNTS
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-emerald-600">{liveCount}</span>
            </div>
          </div>
        </div>

        {/* Hedge Quick Strip Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs border border-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  HEDGE MANAGER STATUS
                </span>
                {activeHedgesCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500 text-white shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {activeHedgesCount} Live Running
                  </span>
                ) : (
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-700/80 text-slate-300">
                    0 Live
                  </span>
                )}
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                  {plannedHedgesCount} Planned for Tomorrow
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onPlanHedgeWithAccount && onPlanHedgeWithAccount(currentAccounts[0] || accounts[0])}
              className="text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Plan Hedge</span>
            </button>
            {onNavigateToHedges && (
              <button
                onClick={onNavigateToHedges}
                className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Hedge Manager</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Accounts Table */}
        <div
          id="dashboard-top-accounts-section"
          className="bg-white border border-[#DEE2E6] rounded flex flex-col overflow-hidden"
        >
          <div className="p-3 px-4 border-b border-[#DEE2E6] bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-slate-600">
                account_balance_wallet
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Current Accounts
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                {currentAccounts.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToTraders && (
                <button
                  id="btn-dashboard-trader-profiles"
                  onClick={onNavigateToTraders}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded"
                >
                  <span className="material-symbols-outlined text-[13px]">group</span>
                  <span>Trader Vault ({tradersCount})</span>
                </button>
              )}
              <button
                id="btn-dashboard-add-account"
                onClick={onOpenConnectModal}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                <span>New Account</span>
              </button>
              <button
                id="btn-dashboard-view-all"
                onClick={onViewAllAccounts}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded"
              >
                <span>Manage All ({accounts.length})</span>
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Active Filter Bar (Ultra-compact & slick) */}
          {hasActiveFilters && (
            <div className="px-4 py-1.5 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-[11px] gap-2 flex-wrap animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-blue-600">filter_alt</span>
                  <span>Filtered:</span>
                </span>
                <span className="text-slate-600 text-[10px]">
                  Showing {currentAccounts.length} of {rawCurrentAccounts.length}
                </span>

                {brokerFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Broker: {brokerFilter}
                    <button
                      onClick={() => setBrokerFilter('ALL')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {phaseFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Status: {phaseFilter}
                    <button
                      onClick={() => setPhaseFilter('ALL')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {balanceFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Balance: {balanceFilter === 'PROFIT' ? '> $10k (Profit)' : '< $10k (Drawdown)'}
                    <button
                      onClick={() => setBalanceFilter('ALL')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {deviceFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Device: Phone {deviceFilter}
                    <button
                      onClick={() => setDeviceFilter('ALL')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {ownerFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Owner: {ownerFilter}
                    <button
                      onClick={() => setOwnerFilter('ALL')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {hedgeStatusFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Hedge Status: {hedgeStatusFilter}
                    <button
                      onClick={() => setHedgeStatusFilter('ALL')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {traderFilter.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white border border-blue-200 text-blue-700 text-[10px] font-bold shadow-2xs">
                    Search: &quot;{traderFilter}&quot;
                    <button
                      onClick={() => setTraderFilter('')}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}

                {sortField && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                    Sort: {sortField} ({sortDirection === 'asc' ? '↑' : '↓'})
                    <button
                      onClick={() => setSortField(null)}
                      className="hover:text-slate-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={resetAllFilters}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-auto"
              >
                Clear all filters
              </button>
            </div>
          )}

          <div className="flex-1 overflow-x-auto relative">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-50 border-b border-[#DEE2E6] z-10 text-[10px] uppercase font-bold text-slate-500 select-none">
                <tr>
                  {/* 1. Broker Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative group">
                    <div className="flex items-center justify-between gap-1.5">
                      <div
                        onClick={() => handleToggleSort('broker')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Broker"
                      >
                        <span className={brokerFilter !== 'ALL' ? 'text-blue-700 font-extrabold' : ''}>
                          Broker
                        </span>
                        {sortField === 'broker' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'broker' ? null : 'broker');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          brokerFilter !== 'ALL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Filter Broker"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {brokerFilter !== 'ALL' ? 'filter_alt' : 'filter_list'}
                        </span>
                      </button>
                    </div>

                    {/* Broker Filter Popover */}
                    {openHeaderDropdown === 'broker' && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-1.5 w-40 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100">
                          Filter Broker
                        </div>
                        <div className="py-1 space-y-0.5">
                          {['ALL', 'Thrivers', 'Fundpips'].map((b) => (
                            <button
                              key={b}
                              onClick={() => {
                                setBrokerFilter(b);
                                setOpenHeaderDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                brokerFilter === b
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{b === 'ALL' ? 'All Brokers' : b}</span>
                              {brokerFilter === b && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            onClick={() => {
                              handleToggleSort('broker');
                              setOpenHeaderDropdown(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">sort_by_alpha</span>
                            <span>Sort Broker {sortField === 'broker' && sortDirection === 'asc' ? 'Z → A' : 'A → Z'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 2. Status / Phase Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        onClick={() => handleToggleSort('phase')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Status"
                      >
                        <span className={phaseFilter !== 'ALL' ? 'text-blue-700 font-extrabold' : ''}>
                          Status
                        </span>
                        {sortField === 'phase' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'phase' ? null : 'phase');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          phaseFilter !== 'ALL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Filter Status"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {phaseFilter !== 'ALL' ? 'filter_alt' : 'filter_list'}
                        </span>
                      </button>
                    </div>

                    {/* Status Filter Popover */}
                    {openHeaderDropdown === 'phase' && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-1.5 w-36 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100">
                          Filter Status
                        </div>
                        <div className="py-1 space-y-0.5">
                          {['ALL', 'Live', 'Phase 1', 'Phase 2'].map((p) => (
                            <button
                              key={p}
                              onClick={() => {
                                setPhaseFilter(p);
                                setOpenHeaderDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                phaseFilter === p
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{p === 'ALL' ? 'All Statuses' : p}</span>
                              {phaseFilter === p && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 3. Account Balance Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative">
                    <div className="flex items-center justify-between gap-1.5">
                      <div
                        onClick={() => handleToggleSort('balance')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Balance"
                      >
                        <span className={balanceFilter !== 'ALL' ? 'text-blue-700 font-extrabold' : ''}>
                          Account Balance
                        </span>
                        {sortField === 'balance' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'balance' ? null : 'balance');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          balanceFilter !== 'ALL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Filter / Sort Balance"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {balanceFilter !== 'ALL' ? 'filter_alt' : 'tune'}
                        </span>
                      </button>
                    </div>

                    {/* Balance Filter Popover */}
                    {openHeaderDropdown === 'balance' && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-1.5 w-48 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100">
                          Balance Filter
                        </div>
                        <div className="py-1 space-y-0.5">
                          {[
                            { id: 'ALL', label: 'All Balances' },
                            { id: 'PROFIT', label: '> $10,000 (In Profit)' },
                            { id: 'DRAWDOWN', label: '< $10,000 (Drawdown)' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setBalanceFilter(item.id);
                                setOpenHeaderDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                balanceFilter === item.id
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item.label}</span>
                              {balanceFilter === item.id && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 pt-1 mt-1 space-y-0.5">
                          <button
                            onClick={() => {
                              setSortField('balance');
                              setSortDirection('desc');
                              setOpenHeaderDropdown(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
                            <span>Sort: Highest Balance First</span>
                          </button>
                          <button
                            onClick={() => {
                              setSortField('balance');
                              setSortDirection('asc');
                              setOpenHeaderDropdown(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                            <span>Sort: Lowest Balance First</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 4. Device Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        onClick={() => handleToggleSort('device')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Device"
                      >
                        <span className={deviceFilter !== 'ALL' ? 'text-blue-700 font-extrabold' : ''}>
                          Device
                        </span>
                        {sortField === 'device' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'device' ? null : 'device');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          deviceFilter !== 'ALL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Filter Phone Slot"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {deviceFilter !== 'ALL' ? 'filter_alt' : 'filter_list'}
                        </span>
                      </button>
                    </div>

                    {/* Device Filter Popover */}
                    {openHeaderDropdown === 'device' && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-1.5 w-36 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100">
                          Filter Phone
                        </div>
                        <div className="py-1 space-y-0.5 max-h-48 overflow-y-auto">
                          <button
                            onClick={() => {
                              setDeviceFilter('ALL');
                              setOpenHeaderDropdown(null);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                              deviceFilter === 'ALL'
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>All Phones</span>
                            {deviceFilter === 'ALL' && (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                          </button>
                          {distinctPhoneSlots.map((phoneNum) => (
                            <button
                              key={phoneNum}
                              onClick={() => {
                                setDeviceFilter(phoneNum.toString());
                                setOpenHeaderDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                deviceFilter === phoneNum.toString()
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>Phone {phoneNum}</span>
                              {deviceFilter === phoneNum.toString() && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 5. Owner Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        onClick={() => handleToggleSort('owner')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Owner"
                      >
                        <span className={ownerFilter !== 'ALL' ? 'text-blue-700 font-extrabold' : ''}>
                          Owner
                        </span>
                        {sortField === 'owner' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'owner' ? null : 'owner');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          ownerFilter !== 'ALL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Filter Owner"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {ownerFilter !== 'ALL' ? 'filter_alt' : 'filter_list'}
                        </span>
                      </button>
                    </div>

                    {/* Owner Filter Popover */}
                    {openHeaderDropdown === 'owner' && (
                      <div
                        ref={dropdownRef}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-1.5 w-36 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100">
                          Filter Owner
                        </div>
                        <div className="py-1 space-y-0.5">
                          {['ALL', 'Ismail', 'Hamza'].map((o) => (
                            <button
                              key={o}
                              onClick={() => {
                                setOwnerFilter(o);
                                setOpenHeaderDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                ownerFilter === o
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{o === 'ALL' ? 'All Owners' : o}</span>
                              {ownerFilter === o && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 6. Trader Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative">
                    <div className="flex items-center justify-between gap-1.5">
                      <div
                        onClick={() => handleToggleSort('trader')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Trader"
                      >
                        <span className={traderFilter.trim() !== '' ? 'text-blue-700 font-extrabold' : ''}>
                          Trader
                        </span>
                        {sortField === 'trader' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'trader' ? null : 'trader');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          traderFilter.trim() !== ''
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Search / Filter Trader"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {traderFilter.trim() !== '' ? 'search' : 'search'}
                        </span>
                      </button>
                    </div>

                    {/* Trader Filter Popover */}
                    {openHeaderDropdown === 'trader' && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-2 w-52 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span>Search Trader</span>
                          {traderFilter && (
                            <button
                              onClick={() => setTraderFilter('')}
                              className="text-blue-600 hover:underline text-[10px] font-bold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">
                            search
                          </span>
                          <input
                            type="text"
                            autoFocus
                            placeholder="Type trader name or ID..."
                            value={traderFilter}
                            onChange={(e) => setTraderFilter(e.target.value)}
                            className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="border-t border-slate-100 pt-1 space-y-0.5">
                          <button
                            onClick={() => {
                              handleToggleSort('trader');
                              setOpenHeaderDropdown(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">sort_by_alpha</span>
                            <span>Sort Name {sortField === 'trader' && sortDirection === 'asc' ? 'Z → A' : 'A → Z'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 7. Hedge Status Header */}
                  <th className="px-3.5 py-2 border-r border-[#E9ECEF] relative">
                    <div className="flex items-center justify-between gap-1.5">
                      <div
                        onClick={() => handleToggleSort('hedgeStatus')}
                        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                        title="Click to sort by Hedge Status"
                      >
                        <span className={hedgeStatusFilter !== 'ALL' ? 'text-blue-700 font-extrabold' : ''}>
                          Hedge Status
                        </span>
                        {sortField === 'hedgeStatus' && (
                          <span className="text-[11px] text-blue-600 font-bold">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenHeaderDropdown(openHeaderDropdown === 'hedgeStatus' ? null : 'hedgeStatus');
                        }}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          hedgeStatusFilter !== 'ALL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                        }`}
                        title="Filter Hedge Status"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {hedgeStatusFilter !== 'ALL' ? 'filter_alt' : 'filter_list'}
                        </span>
                      </button>
                    </div>

                    {/* Hedge Status Filter Popover */}
                    {openHeaderDropdown === 'hedgeStatus' && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-2 top-full mt-1 bg-white border border-[#DEE2E6] rounded-md shadow-lg z-30 p-1.5 w-48 text-left normal-case font-normal text-xs animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100">
                          Filter Hedge Status
                        </div>
                        <div className="py-1 space-y-0.5">
                          {[
                            { id: 'ALL', label: 'All Statuses' },
                            { id: 'Hedge Tomorrow', label: 'Hedge Tomorrow' },
                            { id: 'On Hold', label: 'On Hold' },
                            { id: 'Kachra', label: 'Kachra (< $9,200)' },
                            { id: 'Running', label: 'Running' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setHedgeStatusFilter(item.id);
                                setOpenHeaderDropdown(null);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer ${
                                hedgeStatusFilter === item.id
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item.label}</span>
                              {hedgeStatusFilter === item.id && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            onClick={() => {
                              handleToggleSort('hedgeStatus');
                              setOpenHeaderDropdown(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">sort_by_alpha</span>
                            <span>Sort Status {sortField === 'hedgeStatus' && sortDirection === 'asc' ? 'Z → A' : 'A → Z'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </th>

                  {/* 8. Action Header */}
                  <th className="px-3 py-2 text-right">Quick Hedge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-[11px]">
                {currentAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                      {hasActiveFilters ? (
                        <div className="space-y-1.5">
                          <div>No accounts match the selected filters.</div>
                          <button
                            onClick={resetAllFilters}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Reset filters
                          </button>
                        </div>
                      ) : (
                        <span>No current active accounts. Click &quot;New Account&quot; to connect one.</span>
                      )}
                    </td>
                  </tr>
                ) : (
                  currentAccounts.map((acc) => renderAccountRow(acc, true))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Old Accounts Section */}
        <div
          id="dashboard-old-accounts-section"
          className="bg-white border border-[#DEE2E6] rounded flex flex-col overflow-hidden"
        >
          <div className="p-3 px-4 border-b border-[#DEE2E6] bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-slate-500">
                history
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Old accounts
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {oldAccounts.length} Total
              </span>
              {oldAccounts.filter((a) => a.phase === 'Passed').length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {oldAccounts.filter((a) => a.phase === 'Passed').length} Passed
                </span>
              )}
              {oldAccounts.filter((a) => a.phase === 'Breached').length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {oldAccounts.filter((a) => a.phase === 'Breached').length} Breached
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              Archived, Breached &amp; Passed Accounts
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-white border-b border-[#DEE2E6] z-10 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5]">Broker</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5] text-center">Status</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5]">Account Balance</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5] text-center">Device</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5] text-center">Owner</th>
                  <th className="px-4 py-2.5 border-r border-[#F1F3F5]">Trader</th>
                  <th className="px-4 py-2.5">Hedge Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5] text-[11px]">
                {oldAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                      No old accounts. When an account is marked as &quot;Breached&quot; or &quot;Passed&quot;, it will move here automatically.
                    </td>
                  </tr>
                ) : (
                  oldAccounts.map((acc) => renderAccountRow(acc, false))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
