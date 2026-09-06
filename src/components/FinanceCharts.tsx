import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { ExpenseItem, ExpenseCurrency, ExpenseCategory, AccountOwner } from '../types';

interface FinanceChartsProps {
  expenses: ExpenseItem[];
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({ expenses }) => {
  const [timeViewMode, setTimeViewMode] = useState<'timeline' | 'cumulative'>('timeline');
  const [activeChartTab, setActiveChartTab] = useState<'overview' | 'categories' | 'owners'>('overview');

  const PKR_RATE = 286;
  const toUSDT = (amount: number, currency: ExpenseCurrency) => {
    if (currency === 'PKR') return amount / PKR_RATE;
    return amount;
  };

  // 1. Time Series Data (Spending Over Time)
  const timeSeriesData = useMemo(() => {
    if (!expenses.length) return [];

    // Group expenses by Date
    const mapByDate = new Map<string, {
      rawDate: string;
      displayDate: string;
      accountFeesUsdt: number;
      phonePackagesUsdt: number;
      vpsUsdt: number;
      otherUsdt: number;
      totalDailyUsdt: number;
      ismailUsdt: number;
      hamzaUsdt: number;
      count: number;
    }>();

    // Sort ascending by date
    const sorted = [...expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((item) => {
      const dStr = item.date;
      const usdt = toUSDT(item.amount, item.currency);

      if (!mapByDate.has(dStr)) {
        let label = dStr;
        try {
          const d = new Date(dStr);
          label = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
        } catch {
          label = dStr;
        }

        mapByDate.set(dStr, {
          rawDate: dStr,
          displayDate: label,
          accountFeesUsdt: 0,
          phonePackagesUsdt: 0,
          vpsUsdt: 0,
          otherUsdt: 0,
          totalDailyUsdt: 0,
          ismailUsdt: 0,
          hamzaUsdt: 0,
          count: 0,
        });
      }

      const entry = mapByDate.get(dStr)!;
      entry.count += 1;
      entry.totalDailyUsdt += usdt;

      if (item.category === 'ACCOUNT_FEE') {
        entry.accountFeesUsdt += usdt;
      } else if (item.category === 'PHONE_PACKAGE') {
        entry.phonePackagesUsdt += usdt;
      } else if (item.category === 'VPS_INFRA') {
        entry.vpsUsdt += usdt;
      } else {
        entry.otherUsdt += usdt;
      }

      if (item.paidBy === 'Ismail') {
        entry.ismailUsdt += usdt;
      } else if (item.paidBy === 'Hamza') {
        entry.hamzaUsdt += usdt;
      }
    });

    let runningCumulative = 0;
    return Array.from(mapByDate.values()).map((entry) => {
      runningCumulative += entry.totalDailyUsdt;
      return {
        ...entry,
        cumulativeUsdt: parseFloat(runningCumulative.toFixed(2)),
        totalDailyUsdt: parseFloat(entry.totalDailyUsdt.toFixed(2)),
        accountFeesUsdt: parseFloat(entry.accountFeesUsdt.toFixed(2)),
        phonePackagesUsdt: parseFloat(entry.phonePackagesUsdt.toFixed(2)),
        vpsUsdt: parseFloat(entry.vpsUsdt.toFixed(2)),
        otherUsdt: parseFloat(entry.otherUsdt.toFixed(2)),
        ismailUsdt: parseFloat(entry.ismailUsdt.toFixed(2)),
        hamzaUsdt: parseFloat(entry.hamzaUsdt.toFixed(2)),
      };
    });
  }, [expenses]);

  // 2. Category Breakdown Data
  const categoryData = useMemo(() => {
    let accountFeeThrivers = 0;
    let accountFeeFundpips = 0;
    let phoneSims = 0;
    let vpsInfra = 0;
    let other = 0;

    expenses.forEach((item) => {
      const usdt = toUSDT(item.amount, item.currency);
      if (item.category === 'ACCOUNT_FEE') {
        const isThrivers =
          item.broker === 'Thrivers' ||
          item.title.toLowerCase().includes('thrivers') ||
          item.title.toLowerCase().includes('yahoodi') ||
          item.description?.toLowerCase().includes('thrivers') ||
          item.description?.toLowerCase().includes('yahoodi');
        if (isThrivers) {
          accountFeeThrivers += usdt;
        } else {
          accountFeeFundpips += usdt;
        }
      } else if (item.category === 'PHONE_PACKAGE') {
        phoneSims += usdt;
      } else if (item.category === 'VPS_INFRA') {
        vpsInfra += usdt;
      } else {
        other += usdt;
      }
    });

    const total = accountFeeThrivers + accountFeeFundpips + phoneSims + vpsInfra + other || 1;

    const list = [
      {
        name: 'Thrivers Accounts',
        category: 'ACCOUNT_FEE',
        value: parseFloat(accountFeeThrivers.toFixed(2)),
        percent: ((accountFeeThrivers / total) * 100).toFixed(1),
        color: '#4F46E5', // Indigo-600
        desc: 'Phase 1 Challenge fees',
      },
      {
        name: 'Fundpips Accounts',
        category: 'ACCOUNT_FEE',
        value: parseFloat(accountFeeFundpips.toFixed(2)),
        percent: ((accountFeeFundpips / total) * 100).toFixed(1),
        color: '#9333EA', // Purple-600
        desc: 'Phase 1 Challenge fees',
      },
      {
        name: 'Phone SIMs (PKR)',
        category: 'PHONE_PACKAGE',
        value: parseFloat(phoneSims.toFixed(2)),
        percent: ((phoneSims / total) * 100).toFixed(1),
        color: '#059669', // Emerald-600
        desc: 'Rs 3,500/mo Mobile Data packages',
      },
      {
        name: 'VPS & Infra',
        category: 'VPS_INFRA',
        value: parseFloat(vpsInfra.toFixed(2)),
        percent: ((vpsInfra / total) * 100).toFixed(1),
        color: '#2563EB', // Blue-600
        desc: 'Proxy servers & Gateway nodes',
      },
    ];

    if (other > 0) {
      list.push({
        name: 'Other Expenses',
        category: 'OTHER',
        value: parseFloat(other.toFixed(2)),
        percent: ((other / total) * 100).toFixed(1),
        color: '#64748B', // Slate-500
        desc: 'Miscellaneous operational costs',
      });
    }

    return list.filter((item) => item.value > 0);
  }, [expenses]);

  // 3. Owner Contribution Comparison Data
  const ownerComparisonData = useMemo(() => {
    const categories: { label: string; catKey: ExpenseCategory | 'ALL'; ismail: number; hamza: number }[] = [
      { label: 'Account Fees', catKey: 'ACCOUNT_FEE', ismail: 0, hamza: 0 },
      { label: 'Phone SIMs', catKey: 'PHONE_PACKAGE', ismail: 0, hamza: 0 },
      { label: 'VPS / Infra', catKey: 'VPS_INFRA', ismail: 0, hamza: 0 },
      { label: 'Total Converted', catKey: 'ALL', ismail: 0, hamza: 0 },
    ];

    expenses.forEach((item) => {
      const usdt = toUSDT(item.amount, item.currency);
      const catEntry = categories.find((c) => c.catKey === item.category);
      const totalEntry = categories.find((c) => c.catKey === 'ALL')!;

      if (item.paidBy === 'Ismail') {
        if (catEntry) catEntry.ismail += usdt;
        totalEntry.ismail += usdt;
      } else if (item.paidBy === 'Hamza') {
        if (catEntry) catEntry.hamza += usdt;
        totalEntry.hamza += usdt;
      }
    });

    return categories.map((c) => ({
      ...c,
      ismail: parseFloat(c.ismail.toFixed(2)),
      hamza: parseFloat(c.hamza.toFixed(2)),
    }));
  }, [expenses]);

  // Custom Tooltip for Recharts
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5 font-sans min-w-[200px]">
          <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between text-slate-200">
            <span>{data.displayDate} ({data.rawDate})</span>
            <span className="text-[10px] text-slate-400">{data.count} {data.count === 1 ? 'record' : 'records'}</span>
          </div>

          <div className="space-y-1 pt-0.5">
            {timeViewMode === 'cumulative' ? (
              <div className="flex items-center justify-between font-mono">
                <span className="text-emerald-400">Cumulative Spend:</span>
                <span className="font-bold text-white">${data.cumulativeUsdt.toFixed(2)} USDT</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between font-mono">
              <span className="text-slate-300">Daily Total:</span>
              <span className="font-bold text-white">${data.totalDailyUsdt.toFixed(2)} USDT</span>
            </div>

            {data.accountFeesUsdt > 0 && (
              <div className="flex items-center justify-between font-mono text-[11px] text-amber-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Account Fees:
                </span>
                <span>${data.accountFeesUsdt.toFixed(2)}</span>
              </div>
            )}

            {data.phonePackagesUsdt > 0 && (
              <div className="flex items-center justify-between font-mono text-[11px] text-emerald-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Phone SIMs:
                </span>
                <span>${data.phonePackagesUsdt.toFixed(2)}</span>
              </div>
            )}

            {data.vpsUsdt > 0 && (
              <div className="flex items-center justify-between font-mono text-[11px] text-blue-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  VPS / Infra:
                </span>
                <span>${data.vpsUsdt.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/80 pt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Ismail: ${data.ismailUsdt.toFixed(2)}</span>
            <span>Hamza: ${data.hamzaUsdt.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1 font-sans">
          <div className="font-bold flex items-center gap-1.5" style={{ color: data.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-[11px] text-slate-300">{data.desc}</div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 font-mono text-xs">
            <span className="text-slate-400">Total:</span>
            <span className="font-bold text-white">${data.value.toFixed(2)} USDT ({data.percent}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5 font-sans">
          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">{label}</div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 font-mono text-xs">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">${entry.value?.toFixed(2)} USDT</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-[#DEE2E6] shadow-2xs overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-4 border-b border-[#DEE2E6] bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-indigo-600">monitoring</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Financial Analytics &amp; Spending Patterns
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time visual tracking of expenditure timelines, category allocations, and partner splits
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2">
          {/* Sub-view switcher */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 border border-slate-300/60 text-xs">
            <button
              onClick={() => setActiveChartTab('overview')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeChartTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spending Timeline
            </button>
            <button
              onClick={() => setActiveChartTab('categories')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeChartTab === 'categories'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Category Breakdown
            </button>
            <button
              onClick={() => setActiveChartTab('owners')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                activeChartTab === 'owners'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Partner Comparison
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-4 md:p-5">
        {/* 1. OVERVIEW: SPENDING OVER TIME */}
        {activeChartTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Expenditure Trajectory: </span>
                Stacked daily spend by category with cumulative growth trajectory.
              </div>

              {/* Timeline Display Mode Toggle */}
              <div className="flex items-center gap-1.5 text-xs self-start sm:self-auto">
                <span className="text-[11px] font-medium text-slate-500">Mode:</span>
                <div className="inline-flex p-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                  <button
                    onClick={() => setTimeViewMode('timeline')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                      timeViewMode === 'timeline'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Daily Stacked
                  </button>
                  <button
                    onClick={() => setTimeViewMode('cumulative')}
                    className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                      timeViewMode === 'cumulative'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cumulative Curve
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {timeViewMode === 'timeline' ? (
                  <BarChart
                    data={timeSeriesData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomTimelineTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="accountFeesUsdt"
                      name="Account Fees (USDT)"
                      stackId="daily"
                      fill="#F59E0B"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="phonePackagesUsdt"
                      name="Phone SIMs (PKR to USDT)"
                      stackId="daily"
                      fill="#10B981"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="vpsUsdt"
                      name="VPS & Infra (USDT)"
                      stackId="daily"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <ComposedChart
                    data={timeSeriesData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomTimelineTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                      iconType="circle"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeUsdt"
                      name="Cumulative Total (USDT)"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCumulative)"
                    />
                    <Bar
                      dataKey="totalDailyUsdt"
                      name="Daily Spend (USDT)"
                      fill="#94A3B8"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. CATEGORIES BREAKDOWN VIEW */}
        {activeChartTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-6 h-[260px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Stats List */}
            <div className="lg:col-span-6 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Allocation Breakdown
              </div>
              {categoryData.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <div className="font-bold text-slate-900">{cat.name}</div>
                      <div className="text-[10px] text-slate-500">{cat.desc}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900">${cat.value.toFixed(2)} USDT</div>
                    <div className="text-[10px] font-semibold text-slate-500">{cat.percent}% share</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. PARTNER COMPARISON (ISMAIL VS HAMZA) */}
        {activeChartTab === 'owners' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Ismail vs Hamza Contributions: </span>
              Side-by-side comparison of expenses paid across account challenges, phone data packages, and infrastructure.
            </div>

            <div className="h-[270px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ownerComparisonData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="ismail"
                    name="Ismail (USDT Equiv)"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="hamza"
                    name="Hamza (USDT Equiv)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
