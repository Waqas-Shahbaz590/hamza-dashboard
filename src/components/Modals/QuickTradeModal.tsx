import React, { useState } from 'react';
import { Account, ActivityItem } from '../../types';

interface QuickTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  targetAccountName?: string;
  onExecuteTrade: (trade: {
    accountName: string;
    type: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    price: number;
  }) => void;
}

export const QuickTradeModal: React.FC<QuickTradeModalProps> = ({
  isOpen,
  onClose,
  accounts,
  targetAccountName,
  onExecuteTrade,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<string>(
    targetAccountName || (accounts[0]?.accountName || 'Alpha Fund A')
  );
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('XAUUSD');
  const [quantity, setQuantity] = useState('1.00');
  const [price, setPrice] = useState('2500.50');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onExecuteTrade({
        accountName: selectedAccount,
        type: side,
        symbol: symbol.toUpperCase().trim(),
        quantity: parseFloat(quantity) || 1.0,
        price: parseFloat(price) || 2500.0,
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const tickerPrices: Record<string, number> = {
    XAUUSD: 2500.5,
    GBPUSD: 1.312,
    AUDUSD: 0.674,
    EURUSD: 1.108,
  };

  const handleSymbolChange = (sym: string) => {
    setSymbol(sym);
    if (tickerPrices[sym]) {
      setPrice(tickerPrices[sym].toFixed(2));
    }
  };

  return (
    <div
      id="quick-trade-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="quick-trade-modal-content"
        className="bg-white border border-[#DEE2E6] rounded w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1C1E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">
              bolt
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Multi-Account Order Sync
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {/* Target Account Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Destination Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL ACCOUNTS">⚡ Broadcast to ALL Synced Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.accountName}>
                  {a.accountName} ({a.broker} - {a.phase})
                </option>
              ))}
            </select>
          </div>

          {/* Side Toggle: BUY / SELL */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 border border-[#DEE2E6]'
              }`}
            >
              BUY (Long)
            </button>

            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 border border-[#DEE2E6]'
              }`}
            >
              SELL (Short)
            </button>
          </div>

          {/* Quick Tickers */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Symbol
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {['XAUUSD', 'GBPUSD', 'AUDUSD', 'EURUSD'].map((sym) => (
                <button
                  type="button"
                  key={sym}
                  onClick={() => handleSymbolChange(sym)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                    symbol === sym
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-[#DEE2E6] hover:bg-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. XAUUSD"
              className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono uppercase focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quantity & Execution Price */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Quantity (Shares)
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Limit / Fill Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Est Total */}
          <div className="p-2.5 bg-slate-50 border border-[#DEE2E6] rounded flex justify-between items-center text-xs">
            <span className="text-slate-500">Estimated Notional Value:</span>
            <span className="font-bold text-slate-900 font-mono">
              ${((parseInt(quantity) || 0) * (parseFloat(price) || 0)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-1 border-t border-[#DEE2E6]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-[#DEE2E6] text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              <span>{isSubmitting ? 'Routing Order...' : `Execute ${side} Order`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
