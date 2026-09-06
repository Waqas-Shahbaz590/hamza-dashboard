import React from 'react';

interface TopAppBarProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNotifications: () => void;
  onOpenTeamModal: () => void;
  onOpenQuickTrade: () => void;
  onToggleMobileMenu: () => void;
  onResetAllData?: () => void;
  unreadNotificationsCount: number;
  lastUpdatedText: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  onOpenTeamModal,
  onOpenQuickTrade,
  onToggleMobileMenu,
  onResetAllData,
  unreadNotificationsCount,
  lastUpdatedText,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  return (
    <header
      id="top-app-bar"
      className="h-14 bg-white border-b border-[#DEE2E6] px-4 md:px-6 flex items-center justify-between shrink-0 z-30 relative"
    >
      {/* Title Area + Mobile Toggle + Sidebar Collapse Button + Last Updated Badge */}
      <div className="flex items-center gap-2">
        {/* Desktop Sidebar Toggle */}
        {onToggleSidebarCollapse && (
          <button
            id="btn-desktop-toggle-sidebar"
            onClick={onToggleSidebarCollapse}
            title={isSidebarCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
            className="hidden md:flex items-center justify-center w-8 h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer mr-1"
            aria-label="Toggle Sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isSidebarCollapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        )}

        <button
          id="btn-hamburger-menu"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-slate-500 hover:text-slate-800 md:hidden rounded hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        <div className="text-xs md:text-sm font-bold flex items-center gap-1.5 text-slate-800">
          <span>{title}</span>
        </div>

        {/* Last updated timestamp */}
        <button
          id="btn-toggle-live-sync"
          type="button"
          title="Timestamp of last modification"
          className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 transition-colors text-[11px] font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-sans font-medium whitespace-nowrap text-slate-700">
            {lastUpdatedText}
          </span>
        </button>
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search Bar */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
            search
          </span>
          <input
            id="global-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-slate-100 border border-transparent focus:border-blue-500 focus:bg-white rounded pl-8 pr-6 py-1 text-xs text-slate-800 focus:outline-none w-44 md:w-56 placeholder-slate-400 font-sans transition-all"
            placeholder="Search accounts"
            type="text"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Notifications Button */}
        <button
          id="btn-topbar-notifications"
          onClick={onOpenNotifications}
          className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          aria-label="View notifications"
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        {/* Clear All Test Data Button */}
        {onResetAllData && (
          <button
            id="btn-topbar-reset-all"
            onClick={onResetAllData}
            title="Clear all accounts, devices, hedges, and expenses for fresh testing"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
            <span className="hidden sm:inline">Reset All Data</span>
          </button>
        )}

        {/* Group / Traders Team Button */}
        <button
          id="btn-topbar-group"
          onClick={onOpenTeamModal}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          aria-label="View synchronized traders"
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
        </button>
      </div>
    </header>
  );
};
