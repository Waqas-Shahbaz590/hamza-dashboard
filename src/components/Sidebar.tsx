import React, { useRef } from 'react';

export type NavigationTab = 'dashboard' | 'hedges' | 'traders' | 'accounts' | 'finances' | 'logs';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenConnectModal: () => void;
  activeAccountsCount: number;
  activeHedgesCount?: number;
  plannedHedgesCount?: number;
  tradersCount?: number;
  expensesCount?: number;
  logsCount: number;
  width: number;
  isCollapsed: boolean;
  onWidthChange: (newWidth: number) => void;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  activeAccountsCount,
  activeHedgesCount = 0,
  plannedHedgesCount = 0,
  tradersCount = 0,
  expensesCount = 0,
  logsCount,
  width,
  isCollapsed,
  onWidthChange,
  onToggleCollapse,
}) => {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  // Full collapse allows 0px or 56px icon rail
  const effectiveWidth = isCollapsed ? 56 : width;

  const coreServices = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: 'dashboard',
      shortcut: '⌘1',
    },
    {
      id: 'hedges' as const,
      label: 'Hedge Manager',
      icon: 'swap_horiz',
      badge: activeHedgesCount > 0 ? `${activeHedgesCount} Live` : (plannedHedgesCount > 0 ? `${plannedHedgesCount} Plan` : undefined),
      badgeColor: activeHedgesCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700',
      shortcut: '⌘2',
    },
    {
      id: 'traders' as const,
      label: 'Trader Profiles',
      icon: 'group',
      badge: tradersCount > 0 ? tradersCount : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-800',
      shortcut: '⌘3',
    },
    {
      id: 'accounts' as const,
      label: 'Broker Accounts',
      icon: 'account_balance_wallet',
      badge: activeAccountsCount,
      shortcut: '⌘4',
    },
    {
      id: 'finances' as const,
      label: 'Finances & Expenses',
      icon: 'payments',
      badge: expensesCount > 0 ? expensesCount : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      shortcut: '⌘5',
    },
    {
      id: 'logs' as const,
      label: 'Activity Logs',
      icon: 'receipt_long',
      badge: logsCount,
      shortcut: '⌘6',
    },
  ];

  // Drag-to-resize logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = isCollapsed ? 220 : width;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const newWidth = Math.max(56, Math.min(380, startWidthRef.current + deltaX));

      if (newWidth < 110) {
        if (!isCollapsed) onToggleCollapse();
      } else {
        if (isCollapsed) onToggleCollapse();
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="main-sidebar-nav"
        style={{ width: `${effectiveWidth}px` }}
        className={`bg-[#FFFFFF] border-r border-[#DEE2E6] flex flex-col shrink-0 h-screen fixed left-0 top-0 z-50 transition-transform md:transition-[width] duration-150 ${
          isOpenMobile ? 'translate-x-0 !w-64' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className={`p-3 border-b border-[#DEE2E6] bg-[#F8F9FA] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="text-base font-bold tracking-tight text-blue-600 flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold shadow-xs shrink-0">
              SZ
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="leading-none text-[13px] font-bold truncate">Shizzy&apos;s</span>
                <span className="text-[8px] font-bold text-slate-500 tracking-wider mt-0.5 truncate">TRADING DASHBOARD</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {/* Quick collapse/expand toggle */}
            <button
              id="btn-toggle-sidebar-collapse"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1 rounded transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>

            {/* Close button on mobile */}
            <button
              id="btn-close-sidebar-mobile"
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 ${isCollapsed ? 'p-1.5' : 'p-2.5'} space-y-1 text-sm overflow-y-auto overflow-x-hidden`}>
          {/* Core Section Header */}
          {!isCollapsed && (
            <div className="px-2 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
              Core Services
            </div>
          )}

          {coreServices.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                title={isCollapsed ? item.label : undefined}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-1.5 py-2' : 'justify-between px-2.5 py-1.5'
                } rounded text-left text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[18px] shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge !== undefined && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {effectiveWidth >= 200 && (
                      <span className="text-[9px] text-slate-400 opacity-60 font-mono">{item.shortcut}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className={`p-2.5 border-t border-[#DEE2E6] bg-slate-50 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} overflow-hidden`}>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0">
              JD
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 truncate">John Doe</p>
                <p className="text-[9px] text-slate-500 truncate">Admin • Cloud Node 1</p>
              </div>
            )}
          </div>
        </div>

        {/* Drag-to-Resize Right Border Handle */}
        <div
          id="sidebar-resize-handle"
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar width"
          className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors z-20 group"
        >
          <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="w-0.5 h-6 bg-blue-600 rounded-full" />
          </div>
        </div>
      </aside>
    </>
  );
};
