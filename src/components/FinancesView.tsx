import React, { useState, useMemo } from 'react';
import { ExpenseItem, ExpenseCategory, ExpenseCurrency, AccountOwner, Trader, Account, BrokerName } from '../types';
import { AddExpenseModal } from './Modals/AddExpenseModal';
import { RenewSingleSimModal } from './Modals/RenewSingleSimModal';
import { FinanceCharts } from './FinanceCharts';

interface FinancesViewProps {
  expenses: ExpenseItem[];
  traders: Trader[];
  accounts: Account[];
  onAddExpense: (expense: ExpenseItem) => void;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  onBatchAddExpenses?: (expenses: ExpenseItem[]) => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  expenses,
  traders,
  accounts,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  // Strict conversion rate: 286 PKR = 1 USDT (USD and USDT are the same)
  const PKR_TO_USDT_RATE = 1 / 286;

  const toUSDT = (amount: number, currency: ExpenseCurrency) => {
    if (currency === 'PKR') return amount * PKR_TO_USDT_RATE;
    return amount; // USDT and USD are identical in value
  };

  // Helper to format date into precise "26 August 2026"
  const formatPreciseDate = (dStr?: string): string => {
    if (!dStr) return '—';
    if (/\d+\s+[A-Za-z]+\s+\d{4}/.test(dStr)) return dStr;
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

  // Helper to compute next renewal date 30 days after
  const computeNextRenewalDate = (dStr?: string): string => {
    if (!dStr) return '—';
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

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<string>('ALL');
  const [selectedBroker, setSelectedBroker] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenewSimModalOpen, setIsRenewSimModalOpen] = useState(false);
  const [renewTargetTraderId, setRenewTargetTraderId] = useState<string | undefined>(undefined);
  const [renewTargetPhoneSlot, setRenewTargetPhoneSlot] = useState<number | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

  // Financial aggregates & widgets calculation
  const stats = useMemo(() => {
    let totalUsdt = 0;
    let totalPkr = 0;

    let ismailUsdtTotal = 0;
    let ismailPkr = 0;
    let ismailDirectUsdt = 0;

    let hamzaUsdtTotal = 0;
    let hamzaPkr = 0;
    let hamzaDirectUsdt = 0;

    let challengeFeesUsdt = 0;
    let challengeFeesCount = 0;

    let totalPaidThrivers = 0;
    let totalPaidFundpips = 0;

    let phonePackagesPkr = 0;
    let phonePackagesCount = 0;

    let vpsUsdt = 0;

    expenses.forEach((item) => {
      const usdtVal = toUSDT(item.amount, item.currency);
      totalUsdt += usdtVal;

      if (item.currency === 'PKR') {
        totalPkr += item.amount;
      }

      // Owner totals
      if (item.paidBy === 'Ismail') {
        ismailUsdtTotal += usdtVal;
        if (item.currency === 'PKR') ismailPkr += item.amount;
        else ismailDirectUsdt += item.amount;
      } else if (item.paidBy === 'Hamza') {
        hamzaUsdtTotal += usdtVal;
        if (item.currency === 'PKR') hamzaPkr += item.amount;
        else hamzaDirectUsdt += item.amount;
      }

      // Category breakdowns
      if (item.category === 'ACCOUNT_FEE') {
        challengeFeesUsdt += usdtVal;
        challengeFeesCount += 1;

        // Broker breakdown
        const isThrivers = item.broker === 'Thrivers' || item.broker === 'Yahoodi' || item.title.toLowerCase().includes('thrivers') || item.title.toLowerCase().includes('yahoodi') || item.description?.toLowerCase().includes('thrivers');
        const isFundpips = item.broker === 'Fundpips' || item.broker === 'Bengali' || item.title.toLowerCase().includes('fundpips') || item.title.toLowerCase().includes('bengali') || item.description?.toLowerCase().includes('fundpips');
        
        if (isThrivers) totalPaidThrivers += usdtVal;
        else if (isFundpips) totalPaidFundpips += usdtVal;
      } else if (item.category === 'PHONE_PACKAGE') {
        phonePackagesPkr += item.currency === 'PKR' ? item.amount : item.amount * 286;
        phonePackagesCount += 1;
      } else if (item.category === 'VPS_INFRA') {
        vpsUsdt += usdtVal;
      }
    });

    // Separate settlement balances:
    // 1. USDT Settlement
    const diffDirectUsdt = (ismailDirectUsdt - hamzaDirectUsdt) / 2;
    // 2. PKR Settlement
    const diffDirectPkr = (ismailPkr - hamzaPkr) / 2;

    // Overall Converted Aggregate (for display purposes)
    const diffCombinedUsdt = (ismailUsdtTotal - hamzaUsdtTotal) / 2;

    return {
      totalUsdt,
      totalPkr,
      totalDirectUsdt: ismailDirectUsdt + hamzaDirectUsdt,
      totalDirectPkr: ismailPkr + hamzaPkr,
      ismailUsdtTotal,
      ismailPkr,
      ismailDirectUsdt,
      hamzaUsdtTotal,
      hamzaPkr,
      hamzaDirectUsdt,
      challengeFeesUsdt,
      challengeFeesCount,
      totalPaidThrivers,
      totalPaidFundpips,
      phonePackagesPkr,
      phonePackagesCount,
      phonePackagesUsdtEquiv: phonePackagesPkr / 286,
      vpsUsdt,
      diffDirectUsdt,
      diffDirectPkr,
      diffCombinedUsdt,
    };
  }, [expenses]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'ALL') count++;
    if (selectedOwner !== 'ALL') count++;
    if (selectedBroker !== 'ALL') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedOwner, selectedBroker, searchQuery]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
        if (selectedOwner !== 'ALL' && item.paidBy !== selectedOwner) return false;
        if (selectedBroker !== 'ALL') {
          const itemBroker = item.broker || (
            item.title.toLowerCase().includes('thrivers') || item.title.toLowerCase().includes('yahoodi') ? 'Thrivers' :
            item.title.toLowerCase().includes('fundpips') || item.title.toLowerCase().includes('bengali') ? 'Fundpips' : null
          );
          if (itemBroker !== selectedBroker) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchTrader = item.traderName?.toLowerCase().includes(q);
          const matchAccount = item.accountName?.toLowerCase().includes(q);
          const matchRef = item.transactionRef?.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchTrader && !matchAccount && !matchRef && !matchNotes) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedCategory, selectedOwner, selectedBroker, searchQuery]);

  // Per-phone package renewal status tracker list (ONLY phones where a package has been lodged)
  const phoneRenewalList = useMemo(() => {
    // Find unique phone slots from lodged PHONE_PACKAGE expenses
    const slotsWithPackages = Array.from(
      new Set(
        expenses
          .filter((e) => e.category === 'PHONE_PACKAGE' && e.phoneSlot !== undefined && e.phoneSlot !== null)
          .map((e) => e.phoneSlot as number)
      )
    ).sort((a: number, b: number) => a - b);

    return slotsWithPackages.map((slot) => {
      const trader = traders.find((t) => t.assignedPhoneSlot === slot);
      
      // Find latest phone package expense for this phone slot
      const latestExp = expenses
        .filter((e) => e.category === 'PHONE_PACKAGE' && (e.phoneSlot === slot || (trader && e.traderId === trader.id)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const renewedOnDate = latestExp?.renewedOn || (latestExp ? formatPreciseDate(latestExp.date) : '—');
      const nextRenewalDate = latestExp?.nextRenewalDate || (latestExp ? computeNextRenewalDate(latestExp.date) : '—');
      const amountPaid = latestExp ? latestExp.amount : 0;
      const paidBy = latestExp ? latestExp.paidBy : (trader?.owner || 'Hamza');

      return {
        phoneSlot: slot,
        traderId: trader?.id,
        traderName: trader?.name || `Phone ${slot}`,
        deviceName: trader?.deviceName || `Phone ${slot} Device`,
        owner: trader?.owner || paidBy,
        amountPaid,
        paidBy,
        renewedOn: renewedOnDate,
        nextRenewalDate,
        latestExpenseId: latestExp?.id,
      };
    });
  }, [traders, expenses]);

  const handleEdit = (item: ExpenseItem) => {
    setEditingExpense(item);
    setIsAddModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingExpense(null);
    setIsAddModalOpen(true);
  };

  const handleOpenRenewForPhone = (slot: number, traderId?: string) => {
    setRenewTargetPhoneSlot(slot);
    setRenewTargetTraderId(traderId);
    setIsRenewSimModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedOwner('ALL');
    setSelectedBroker('ALL');
    setSearchQuery('');
  };

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'ACCOUNT_FEE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="material-symbols-outlined text-[13px] text-amber-600">account_balance</span>
            <span>Account Fee</span>
          </span>
        );
      case 'PHONE_PACKAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="material-symbols-outlined text-[13px] text-emerald-600">smartphone</span>
            <span>Phone SIM</span>
          </span>
        );
      case 'VPS_INFRA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="material-symbols-outlined text-[13px] text-blue-600">dns</span>
            <span>VPS / Proxy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <span className="material-symbols-outlined text-[13px] text-purple-600">more_horiz</span>
            <span>Other</span>
          </span>
        );
    }
  };

  return (
    <div id="finances-view-container" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E]">
      <div className="max-w-7xl mx-auto space-y-5 pb-16">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#DEE2E6] shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[24px]">account_balance_wallet</span>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Finances &amp; Expense Ledger</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phase 1 challenge fees in USDT, phone data packages in PKR, and owner settlement splits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="log-expense-btn"
              onClick={handleCreateNew}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Currency Conversion Note Banner */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-slate-100/90 border border-slate-200 rounded-lg text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-500">info</span>
            <span>
              <strong className="text-slate-800 font-semibold">For Conversion:</strong> Fixed rate of{' '}
              <span className="font-mono font-bold text-slate-900">286 PKR = 1 USDT</span>.
            </span>
          </div>
        </div>

        {/* KPI Metrics / Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Expenses USDT Equiv */}
          <div className="bg-white p-4 rounded-xl border border-[#DEE2E6] shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Expenses</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {stats.totalUsdt.toFixed(2)} <span className="text-xs font-normal text-slate-500">USDT</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Rs {stats.totalPkr.toLocaleString()} PKR</span>
              <span>•</span>
              <span>{expenses.length} Records</span>
            </div>
          </div>

          {/* Total Paid to Thrivers */}
          <div className="bg-white p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/15 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-900 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Paid to Thrivers</span>
              <span className="material-symbols-outlined text-[18px] text-indigo-600">hub</span>
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-950">
              {stats.totalPaidThrivers.toFixed(0)} <span className="text-xs font-normal text-indigo-700">USDT</span>
            </div>
            <div className="text-[11px] text-indigo-800 mt-1">
              Phase 1 challenge account fees
            </div>
          </div>

          {/* Total Paid to Fundpips */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200/70 bg-emerald-50/15 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-900 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Paid to Fundpips</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">language</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950">
              {stats.totalPaidFundpips.toFixed(0)} <span className="text-xs font-normal text-emerald-700">USDT</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1">
              Phase 1 challenge account fees
            </div>
          </div>

          {/* Total Paid in SIM Packages */}
          <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">SIM Packages</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">smartphone</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950">
              Rs {stats.phonePackagesPkr.toLocaleString()} <span className="text-xs font-normal text-emerald-700">PKR</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1 font-mono">
              ≈ {stats.phonePackagesUsdtEquiv.toFixed(2)} USDT ({stats.phonePackagesCount} renewals)
            </div>
          </div>

          {/* Total Challenge Fees */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Challenge Fees</span>
              <span className="material-symbols-outlined text-[18px] text-amber-600">verified</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950">
              {stats.challengeFeesUsdt.toFixed(0)} <span className="text-xs font-normal text-amber-700">USDT</span>
            </div>
            <div className="text-[11px] text-amber-800 mt-1">
              {stats.challengeFeesCount} Phase 1 accounts opened
            </div>
          </div>
        </div>

        {/* 50/50 Owner Contribution Split & Settlement Card */}
        <div className="bg-white p-4 rounded-xl border border-[#DEE2E6] shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-700">balance</span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  50/50 Owner Contribution Split &amp; Settlement Balances
                </h2>
                <p className="text-[11px] text-slate-500">
                  Independent currency settlement pools for actual USDT accounts &amp; PKR SIM packages
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. USDT Settlement Pool Card */}
            <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <span className="material-symbols-outlined text-[17px] text-blue-600">attach_money</span>
                    <span>USDT Settlement Pool</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-blue-900">
                    {stats.totalDirectUsdt.toFixed(2)} USDT Total
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-2">
                  <span>Ismail: <strong className="text-blue-900 font-mono">{stats.ismailDirectUsdt.toFixed(2)} USDT</strong></span>
                  <span>Hamza: <strong className="text-emerald-900 font-mono">{stats.hamzaDirectUsdt.toFixed(2)} USDT</strong></span>
                </div>

                {/* Split Bar */}
                <div className="w-full bg-slate-200/80 h-2 rounded-full mt-1.5 overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${stats.totalDirectUsdt > 0 ? (stats.ismailDirectUsdt / stats.totalDirectUsdt) * 100 : 50}%` }}
                    title={`Ismail: ${stats.totalDirectUsdt > 0 ? ((stats.ismailDirectUsdt / stats.totalDirectUsdt) * 100).toFixed(0) : 50}%`}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${stats.totalDirectUsdt > 0 ? (stats.hamzaDirectUsdt / stats.totalDirectUsdt) * 100 : 50}%` }}
                    title={`Hamza: ${stats.totalDirectUsdt > 0 ? ((stats.hamzaDirectUsdt / stats.totalDirectUsdt) * 100).toFixed(0) : 50}%`}
                  />
                </div>
              </div>

              {/* Settlement Outcome */}
              <div className="mt-3 p-2.5 rounded-lg bg-white border border-blue-200/70 text-xs shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                  USDT Settlement Status
                </div>
                {stats.diffDirectUsdt > 0 ? (
                  <div className="text-emerald-800 font-medium">
                    <strong>Hamza</strong> owes <strong>Ismail</strong>{' '}
                    <span className="font-mono font-bold text-sm text-emerald-900">{stats.diffDirectUsdt.toFixed(2)} USDT</span> to balance USDT 50/50
                  </div>
                ) : stats.diffDirectUsdt < 0 ? (
                  <div className="text-blue-800 font-medium">
                    <strong>Ismail</strong> owes <strong>Hamza</strong>{' '}
                    <span className="font-mono font-bold text-sm text-blue-900">{Math.abs(stats.diffDirectUsdt).toFixed(2)} USDT</span> to balance USDT 50/50
                  </div>
                ) : (
                  <div className="text-slate-600 font-medium">USDT expenses are perfectly balanced 50/50</div>
                )}
              </div>
            </div>

            {/* 2. PKR Settlement Pool Card */}
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <span className="material-symbols-outlined text-[17px] text-emerald-600">payments</span>
                    <span>PKR Settlement Pool</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-emerald-900">
                    Rs {stats.totalDirectPkr.toLocaleString()} PKR Total
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-2">
                  <span>Ismail: <strong className="text-blue-900 font-mono">Rs {stats.ismailPkr.toLocaleString()} PKR</strong></span>
                  <span>Hamza: <strong className="text-emerald-900 font-mono">Rs {stats.hamzaPkr.toLocaleString()} PKR</strong></span>
                </div>

                {/* Split Bar */}
                <div className="w-full bg-slate-200/80 h-2 rounded-full mt-1.5 overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${stats.totalDirectPkr > 0 ? (stats.ismailPkr / stats.totalDirectPkr) * 100 : 50}%` }}
                    title={`Ismail: ${stats.totalDirectPkr > 0 ? ((stats.ismailPkr / stats.totalDirectPkr) * 100).toFixed(0) : 50}%`}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${stats.totalDirectPkr > 0 ? (stats.hamzaPkr / stats.totalDirectPkr) * 100 : 50}%` }}
                    title={`Hamza: ${stats.totalDirectPkr > 0 ? ((stats.hamzaPkr / stats.totalDirectPkr) * 100).toFixed(0) : 50}%`}
                  />
                </div>
              </div>

              {/* Settlement Outcome */}
              <div className="mt-3 p-2.5 rounded-lg bg-white border border-emerald-200/70 text-xs shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                  PKR Settlement Status
                </div>
                {stats.diffDirectPkr > 0 ? (
                  <div className="text-emerald-800 font-medium">
                    <strong>Hamza</strong> owes <strong>Ismail</strong>{' '}
                    <span className="font-mono font-bold text-sm text-emerald-900">Rs {stats.diffDirectPkr.toLocaleString()} PKR</span> to balance PKR 50/50
                  </div>
                ) : stats.diffDirectPkr < 0 ? (
                  <div className="text-blue-800 font-medium">
                    <strong>Ismail</strong> owes <strong>Hamza</strong>{' '}
                    <span className="font-mono font-bold text-sm text-blue-900">Rs {Math.abs(stats.diffDirectPkr).toLocaleString()} PKR</span> to balance PKR 50/50
                  </div>
                ) : (
                  <div className="text-slate-600 font-medium">PKR expenses are perfectly balanced 50/50</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Analytics & Spending Charts */}
        <FinanceCharts expenses={expenses} />

        {/* Phone SIM Package Renewal Tracker (Last Renewed & Next Due) */}
        <div className="bg-white rounded-xl border border-[#DEE2E6] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#DEE2E6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-emerald-600">sim_card</span>
                <span>Phone SIM Data Package Renewal Tracker (Rs 3,500/Month)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Track exact renewal dates and next cycle schedules for each trader phone
              </p>
            </div>
          </div>

          {/* Renewal Tracker Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DEE2E6] bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">Phone #</th>
                  <th className="py-2.5 px-3">Trader Name</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-center">Paid By</th>
                  <th className="py-2.5 px-3">Renewed On</th>
                  <th className="py-2.5 px-3">Next Renewal Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phoneRenewalList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
                        sim_card_download
                      </span>
                      No SIM packages lodged yet. When you log a SIM package expense for a phone slot, it will automatically appear here with exact 30-day renewal cycle countdowns.
                    </td>
                  </tr>
                ) : (
                  phoneRenewalList.map((item) => (
                    <tr key={item.phoneSlot} className="hover:bg-slate-50/80 transition-colors">
                      {/* Phone # */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center">
                            #{item.phoneSlot}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">Phone {item.phoneSlot}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{item.deviceName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Trader Name */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.traderName}</div>
                        <div className="text-[10px] text-slate-400">Assigned: {item.owner}</div>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-700">Rs {item.amountPaid.toLocaleString()} PKR</span>
                        <div className="text-[10px] text-slate-400 font-mono">≈ {(item.amountPaid / 286).toFixed(2)} USDT</div>
                      </td>

                      {/* Paid By */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.paidBy === 'Ismail'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{item.paidBy}</span>
                        </span>
                      </td>

                      {/* Renewed On */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-800 font-semibold font-mono">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>
                          <span>{item.renewedOn}</span>
                        </div>
                      </td>

                      {/* Next Renewal Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-emerald-900 font-bold font-mono">
                          <span className="material-symbols-outlined text-[14px] text-emerald-600">event_repeat</span>
                          <span>{item.nextRenewalDate}</span>
                        </div>
                      </td>

                      {/* Quick Renew Button */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenRenewForPhone(item.phoneSlot, item.traderId)}
                          className="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">refresh</span>
                          <span>Renew SIM</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Ledger (All Categories) */}
        <div className="bg-white rounded-xl border border-[#DEE2E6] shadow-2xs overflow-hidden">
          {/* Table Header Toolbar */}
          <div className="p-3.5 border-b border-[#DEE2E6] bg-slate-50/60 flex flex-wrap items-center justify-between gap-2.5">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Categories ({expenses.length})
              </button>
              <button
                onClick={() => setSelectedCategory('PHONE_PACKAGE')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'PHONE_PACKAGE'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Phone SIMs
              </button>
              <button
                onClick={() => setSelectedCategory('ACCOUNT_FEE')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'ACCOUNT_FEE'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Account Fees
              </button>
              <button
                onClick={() => setSelectedCategory('VPS_INFRA')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'VPS_INFRA'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                VPS / Infra
              </button>
            </div>

            {/* Filter Toggle Button & Search */}
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
              {/* Filter Button */}
              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isFilterPanelOpen || activeFiltersCount > 0
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">filter_list</span>
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-48">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[15px] text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Expandable Filter Panel */}
          {isFilterPanelOpen && (
            <div className="p-3 bg-slate-100/70 border-b border-[#DEE2E6] flex flex-wrap items-center gap-3 text-xs">
              {/* Owner Filter */}
              <div className="flex items-center gap-1.5">
                <label className="font-bold text-slate-600 text-[11px]">Owner:</label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Owners</option>
                  <option value="Ismail">Paid by Ismail</option>
                  <option value="Hamza">Paid by Hamza</option>
                </select>
              </div>

              {/* Broker Filter */}
              <div className="flex items-center gap-1.5">
                <label className="font-bold text-slate-600 text-[11px]">Broker / Entity:</label>
                <select
                  value={selectedBroker}
                  onChange={(e) => setSelectedBroker(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Brokers / Targets</option>
                  <option value="Thrivers">Thrivers</option>
                  <option value="Fundpips">Fundpips</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="ml-auto text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          )}

          {/* Expenses Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DEE2E6] bg-slate-100/75 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Linkage / Target</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">USDT Equiv</th>
                  <th className="py-2.5 px-3 text-center">Paid By</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">
                        receipt_long
                      </span>
                      No expense records found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((item) => {
                    const usdtVal = toUSDT(item.amount, item.currency);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Date */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {formatPreciseDate(item.date)}
                        </td>

                        {/* Category Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {getCategoryBadge(item.category)}
                        </td>

                        {/* One-Liner Title */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.title}</div>
                          {item.notes && (
                            <div className="text-[10px] text-indigo-600 italic mt-0.5 line-clamp-1">{item.notes}</div>
                          )}
                        </td>

                        {/* Linkage / Target */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {item.category === 'PHONE_PACKAGE' && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                Phone {item.phoneSlot || '#'}
                              </span>
                              <span className="text-slate-800 font-medium">{item.traderName || 'SIM'}</span>
                            </div>
                          )}
                          {item.category === 'ACCOUNT_FEE' && (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.broker === 'Thrivers' || item.title.toLowerCase().includes('thrivers') || item.broker === 'Yahoodi' || item.title.toLowerCase().includes('yahoodi')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {item.broker || (item.title.toLowerCase().includes('thrivers') || item.title.toLowerCase().includes('yahoodi') ? 'Thrivers' : 'Fundpips')}
                              </span>
                              <span className="text-slate-800 font-medium">{item.accountName || item.accountSize || 'Phase 1'}</span>
                            </div>
                          )}
                          {item.category === 'VPS_INFRA' && (
                            <span className="text-[11px] text-slate-600 font-mono">Infrastructure Node</span>
                          )}
                          {item.category === 'OTHER' && (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {item.currency === 'PKR' ? (
                            <span className="text-emerald-700">Rs {item.amount.toLocaleString()} PKR</span>
                          ) : (
                            <span className="text-slate-900">{item.amount.toLocaleString()} USDT</span>
                          )}
                        </td>

                        {/* USDT Equivalent */}
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-700 font-semibold whitespace-nowrap">
                          {usdtVal.toFixed(2)} USDT
                        </td>

                        {/* Paid By (Owner) */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.paidBy === 'Ismail'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{item.paidBy}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                            </button>
                            <button
                              onClick={() => setExpenseToDelete(item)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal: Delete Confirmation */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-700">
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                <h3 className="font-bold text-sm text-slate-900">Delete Expense Record</h3>
              </div>
              <button
                onClick={() => setExpenseToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this expense record from the ledger?
              </p>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{expenseToDelete.title}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Paid by: <strong className="text-slate-700">{expenseToDelete.paidBy}</strong></span>
                  <span className="font-mono font-bold text-slate-800">
                    {expenseToDelete.currency === 'PKR' ? `Rs ${expenseToDelete.amount.toLocaleString()} PKR` : `${expenseToDelete.amount.toLocaleString()} USDT`}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-rose-600 font-medium">
                This will recalculate all 50/50 settlement balances and summary totals.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>Yes, Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log / Edit Expense */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        onSaveExpense={(saved) => {
          if (editingExpense) {
            onUpdateExpense(saved);
          } else {
            onAddExpense(saved);
          }
        }}
        editingExpense={editingExpense}
        traders={traders}
        accounts={accounts}
      />

      {/* Modal: Single Phone SIM Package Renewal */}
      <RenewSingleSimModal
        isOpen={isRenewSimModalOpen}
        onClose={() => {
          setIsRenewSimModalOpen(false);
          setRenewTargetTraderId(undefined);
          setRenewTargetPhoneSlot(undefined);
        }}
        onConfirmRenewal={(expense) => {
          onAddExpense(expense);
        }}
        traders={traders}
        initialTraderId={renewTargetTraderId}
        initialPhoneSlot={renewTargetPhoneSlot}
      />
    </div>
  );
};
