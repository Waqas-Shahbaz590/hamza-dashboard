import React, { useState } from 'react';
import { Account } from '../types';

interface PerformanceViewProps {
  accounts: Account[];
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ accounts }) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1M');

  // Performance stats
  const totalEquity = accounts.reduce((sum, a) => sum + a.equity, 0);

  // Broker allocations
  const brokerMap = accounts.reduce((acc: Record<string, number>, a: Account) => {
    acc[a.broker] = (acc[a.broker] || 0) + a.equity;
    return acc;
  }, {} as Record<string, number>);

  const brokerAllocations = Object.entries(brokerMap).map(([broker, equity]) => ({
    broker,
    equity: Number(equity),
    percentage: totalEquity > 0 ? (Number(equity) / totalEquity) * 100 : 0,
  }));

  // Mock performance curve points based on timeframe
  const chartPoints = [
    { label: 'Aug 01', value: 11.2, pnl: '+1.8%' },
    { label: 'Aug 05', value: 11.5, pnl: '+2.4%' },
    { label: 'Aug 09', value: 11.3, pnl: '-0.6%' },
    { label: 'Aug 13', value: 11.8, pnl: '+3.1%' },
    { label: 'Aug 17', value: 12.1, pnl: '+2.5%' },
    { label: 'Aug 21', value: 12.0, pnl: '-0.8%' },
    { label: 'Aug 25', value: 12.4, pnl: '+3.3%' },
  ];

  const topAssets = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', pnl: 24500, winRate: '82%', trades: 34, returnPct: '+4.8%' },
    { symbol: 'AAPL', name: 'Apple Inc', pnl: 18200, winRate: '75%', trades: 28, returnPct: '+3.2%' },
    { symbol: 'MSFT', name: 'Microsoft Corp', pnl: 14100, winRate: '71%', trades: 19, returnPct: '+2.9%' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', pnl: 8900, winRate: '68%', trades: 45, returnPct: '+1.6%' },
    { symbol: 'TSLA', name: 'Tesla Inc', pnl: -4200, winRate: '48%', trades: 22, returnPct: '-1.4%' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E] space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            Group Performance Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Consolidated multi-broker yield, quantitative risk factors, and institutional metrics.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center bg-white p-0.5 rounded border border-[#DEE2E6]">
          {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-blue-50 text-blue-700 font-mono'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Quantitative Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Sharpe Ratio
          </p>
          <p className="text-lg font-bold text-emerald-600 font-mono">2.84</p>
          <p className="text-[10px] text-slate-500">Risk adjusted (Top 5%)</p>
        </div>

        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Profit Factor
          </p>
          <p className="text-lg font-bold text-emerald-600 font-mono">2.18</p>
          <p className="text-[10px] text-slate-500">Gain / Loss Ratio</p>
        </div>

        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Win Rate
          </p>
          <p className="text-lg font-bold text-slate-800 font-mono">68.5%</p>
          <p className="text-[10px] text-slate-500">148 Orders</p>
        </div>

        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Max Drawdown
          </p>
          <p className="text-lg font-bold text-rose-600 font-mono">-4.12%</p>
          <p className="text-[10px] text-slate-500">Safe Threshold</p>
        </div>

        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Daily VaR (95%)
          </p>
          <p className="text-lg font-bold text-blue-600 font-mono">$28.4K</p>
          <p className="text-[10px] text-slate-500">Value at Risk</p>
        </div>

        <div className="bg-white p-3 rounded border border-[#DEE2E6]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Beta vs SPX
          </p>
          <p className="text-lg font-bold text-slate-800 font-mono">0.42</p>
          <p className="text-[10px] text-slate-500">Low market beta</p>
        </div>
      </div>

      {/* Main Chart + Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity Curve Graph (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#DEE2E6] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Aggregated Equity Growth Curve
              </h3>
              <p className="text-[11px] text-slate-400">
                Live consolidated multi-broker equity trajectory
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 font-mono">
              +10.7% ($1.2M MTD)
            </span>
          </div>

          {/* SVG Visual Graphic Chart */}
          <div className="w-full h-56 relative bg-slate-50 rounded p-3 border border-[#DEE2E6] flex flex-col justify-end">
            {/* Grid lines */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-slate-200" />
              <div className="border-b border-slate-200" />
              <div className="border-b border-slate-200" />
              <div className="border-b border-slate-200" />
            </div>

            {/* Sparkline curve */}
            <svg className="w-full h-36 overflow-visible" viewBox="0 0 600 150">
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,130 Q 100,100 200,110 T 400,60 T 600,20 L 600,150 L 0,150 Z"
                fill="url(#equityGrad)"
              />
              <path
                d="M 0,130 Q 100,100 200,110 T 400,60 T 600,20"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Data points */}
              <circle cx="0" cy="130" r="3.5" fill="#2563eb" />
              <circle cx="200" cy="110" r="3.5" fill="#2563eb" />
              <circle cx="400" cy="60" r="3.5" fill="#2563eb" />
              <circle cx="600" cy="20" r="4.5" fill="#2563eb" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-200">
              {chartPoints.map((pt, i) => (
                <span key={i}>{pt.label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Broker Distribution Allocation (1 col) */}
        <div className="bg-white border border-[#DEE2E6] rounded p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-0.5">
              Broker Equity Allocation
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Capital distribution across custodian brokers
            </p>

            <div className="space-y-3">
              {brokerAllocations.map((item) => (
                <div key={item.broker} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-800 font-medium">{item.broker}</span>
                    <span className="text-blue-600 font-mono font-bold">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-[#DEE2E6]">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DEE2E6] text-[10px] text-slate-500 flex items-center justify-between">
            <span>Custody Risk Level:</span>
            <span className="text-emerald-600 font-bold font-mono">Tier-1 Optimal</span>
          </div>
        </div>
      </div>

      {/* Top Assets Table */}
      <div className="bg-white border border-[#DEE2E6] rounded overflow-hidden">
        <div className="p-3 border-b border-[#DEE2E6] bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Top Traded Instruments (Multi-Account Aggregation)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white border-b border-[#DEE2E6] text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="px-3.5 py-2 border-r border-[#F1F3F5]">Ticker</th>
                <th className="px-3.5 py-2 border-r border-[#F1F3F5]">Asset Name</th>
                <th className="px-3.5 py-2 border-r border-[#F1F3F5] text-right">Net P&amp;L</th>
                <th className="px-3.5 py-2 border-r border-[#F1F3F5] text-center">Win Rate</th>
                <th className="px-3.5 py-2 border-r border-[#F1F3F5] text-center">Orders</th>
                <th className="px-3.5 py-2 text-right">Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F5] text-[11px] font-mono">
              {topAssets.map((asset) => {
                const isPositive = asset.pnl > 0;
                return (
                  <tr key={asset.symbol} className="data-table-row hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-2 font-bold text-blue-600">
                      ${asset.symbol}
                    </td>
                    <td className="px-3.5 py-2 text-slate-800 font-sans">{asset.name}</td>
                    <td
                      className={`px-3.5 py-2 text-right font-medium ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? `+$${asset.pnl.toLocaleString()}` : `-$${Math.abs(asset.pnl).toLocaleString()}`}
                    </td>
                    <td className="px-3.5 py-2 text-center text-slate-800">
                      {asset.winRate}
                    </td>
                    <td className="px-3.5 py-2 text-center text-slate-500">
                      {asset.trades}
                    </td>
                    <td
                      className={`px-3.5 py-2 text-right font-semibold ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {asset.returnPct}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
