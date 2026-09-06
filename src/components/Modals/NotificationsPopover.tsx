import React from 'react';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      title: 'Interactive Brokers Sync Complete',
      desc: 'All 3 account balances and positions refreshed in 14ms.',
      time: '3m ago',
      type: 'success',
    },
    {
      id: 'n2',
      title: 'Target Execution Order Filled',
      desc: 'BUY 500 AAPL @ $185.20 executed for Alpha Fund A.',
      time: '12m ago',
      type: 'trade',
    },
    {
      id: 'n3',
      title: 'Risk Guard Threshold Normal',
      desc: 'Group leverage within standard safety limit (3.2x vs 5.0x cap).',
      time: '1h ago',
      type: 'info',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-4 top-14 z-50 w-80 sm:w-96 bg-white border border-[#DEE2E6] rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#1A1C1E]">
        <div className="p-3 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600">
              notifications
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">System Notifications</span>
          </div>
          <button
            onClick={onClearAll}
            className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Mark Read
          </button>
        </div>

        <div className="divide-y divide-[#DEE2E6] max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.desc}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    {n.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
