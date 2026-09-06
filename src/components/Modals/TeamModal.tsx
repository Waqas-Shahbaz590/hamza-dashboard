import React from 'react';
import { BRAND_ASSETS } from '../../data/mockData';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const traders = [
    {
      name: 'John Doe',
      role: 'Lead Quantitative Trader',
      status: 'Active (Desktop Terminal)',
      accounts: 2,
      equity: '$5,150,000.00',
      avatar: BRAND_ASSETS.avatarAdmin,
    },
    {
      name: 'Sarah Jenkins',
      role: 'Macro Risk Manager',
      status: 'Active (Mobile Sync)',
      accounts: 2,
      equity: '$3,200,500.25',
      avatar: BRAND_ASSETS.avatarTrader,
    },
    {
      name: 'Michael Chen',
      role: 'Derivatives & Swing Lead',
      status: 'Active (Chicago Co-lo)',
      accounts: 2,
      equity: '$4,050,000.00',
      avatar: BRAND_ASSETS.avatarTrader,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#DEE2E6] rounded w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1C1E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">group</span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Trading Circle Members</h3>
              <p className="text-[10px] text-slate-500">
                Multi-trader permissions and live sync sessions
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

        <div className="p-4 space-y-2.5">
          {traders.map((t, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded border border-[#DEE2E6] flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#DEE2E6]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-500">{t.role}</p>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t.status}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 font-mono">{t.equity}</p>
                <p className="text-[10px] text-slate-500">{t.accounts} Synced Accounts</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 border-t border-[#DEE2E6] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#DEE2E6] rounded text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
