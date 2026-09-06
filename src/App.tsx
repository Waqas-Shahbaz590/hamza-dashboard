import React, { useState, useEffect } from 'react';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { DashboardView } from './components/DashboardView';
import { HedgeManagerView } from './components/HedgeManagerView';
import { TradersView } from './components/TradersView';
import { AccountsView } from './components/AccountsView';
import { FinancesView } from './components/FinancesView';
import { LogsView } from './components/LogsView';
import { ConnectBrokerModal } from './components/Modals/ConnectBrokerModal';
import { AccountDetailModal } from './components/Modals/AccountDetailModal';
import { QuickTradeModal } from './components/Modals/QuickTradeModal';
import { NotificationsPopover } from './components/Modals/NotificationsPopover';
import { TeamModal } from './components/Modals/TeamModal';
import { PlanHedgeModal } from './components/Modals/PlanHedgeModal';
import { ExecuteHedgeModal } from './components/Modals/ExecuteHedgeModal';
import { CloseHedgeModal } from './components/Modals/CloseHedgeModal';
import { TraderModal } from './components/Modals/TraderModal';
import {
  Account,
  AccountPhase,
  AccountHedgeStatus,
  AppLogEntry,
  LogFieldChange,
  PlannedHedge,
  ActiveHedge,
  ClosedHedge,
  Trader,
  ExpenseItem,
} from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_LOGS,
  INITIAL_PLANNED_HEDGES,
  INITIAL_ACTIVE_HEDGES,
  INITIAL_CLOSED_HEDGES,
  INITIAL_TRADERS,
  INITIAL_EXPENSES,
  BROKER_LOGOS,
} from './data/mockData';
import {
  seedInitialFirestoreDataIfEmpty,
  subscribeToAccounts,
  subscribeToTraders,
  subscribeToExpenses,
  subscribeToPlannedHedges,
  subscribeToActiveHedges,
  subscribeToClosedHedges,
  subscribeToLogs,
  subscribeToMeta,
  saveAccountToFirestore,
  deleteAccountFromFirestore,
  saveTraderToFirestore,
  deleteTraderFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  savePlannedHedgeToFirestore,
  deletePlannedHedgeFromFirestore,
  saveActiveHedgeToFirestore,
  deleteActiveHedgeFromFirestore,
  saveClosedHedgeToFirestore,
  deleteClosedHedgeFromFirestore,
  saveLogToFirestore,
  saveMetaToFirestore,
  clearAllCollectionsFromFirestore,
} from './services/firestoreService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Finances & Expenses state
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('tc_v5_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Traders state
  const [traders, setTraders] = useState<Trader[]>(() => {
    const saved = localStorage.getItem('tc_v5_traders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('tc_v5_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((acc: any) => {
            const validBroker: 'Thrivers' | 'Fundpips' =
              acc.broker === 'Thrivers' || acc.broker === 'Fundpips' || acc.broker === 'Yahoodi'
                ? (acc.broker === 'Yahoodi' ? 'Thrivers' : acc.broker === 'Bengali' ? 'Fundpips' : acc.broker)
                : 'Thrivers';
            let validPhase: 'Live' | 'Phase 1' | 'Phase 2' = 'Live';
            if (acc.phase === 'Phase 1' || acc.phase === 'Phase 2' || acc.phase === 'Live') {
              validPhase = acc.phase;
            } else if (acc.phase === 'DEMO') {
              validPhase = 'Phase 1';
            } else if (acc.phase === 'FLAT') {
              validPhase = 'Phase 2';
            }
            return {
              ...acc,
              broker: validBroker,
              brokerLogo: BROKER_LOGOS[validBroker],
              phase: validPhase,
              phone: acc.phone || 1,
            };
          });
        }
      } catch (e) {}
    }
    return [];
  });

  const [logs, setLogs] = useState<AppLogEntry[]>(() => {
    const saved = localStorage.getItem('tc_v5_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Hedges state
  const [plannedHedges, setPlannedHedges] = useState<PlannedHedge[]>(() => {
    const saved = localStorage.getItem('tc_v5_planned_hedges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [activeHedges, setActiveHedges] = useState<ActiveHedge[]>(() => {
    const saved = localStorage.getItem('tc_v5_active_hedges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [closedHedges, setClosedHedges] = useState<ClosedHedge[]>(() => {
    const saved = localStorage.getItem('tc_v5_closed_hedges');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Helper for Last Updated timestamp format
  const formatLastUpdatedString = (d: Date = new Date()) => {
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = months[d.getMonth()];
    const year = d.getFullYear();
    return `Last updated: ${timeStr} ${day}-${monthStr}-${year}`;
  };

  const [lastUpdatedText, setLastUpdatedText] = useState<string>(() => {
    const saved = localStorage.getItem('trading_circle_last_updated');
    if (saved) return saved;
    return formatLastUpdatedString(new Date());
  });

  const recordChangeTimestamp = () => {
    const updated = formatLastUpdatedString(new Date());
    setLastUpdatedText(updated);
    localStorage.setItem('trading_circle_last_updated', updated);
    saveMetaToFirestore({ lastUpdatedText: updated }).catch(console.error);
  };

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectModalInitialTraderId, setConnectModalInitialTraderId] = useState<string | undefined>(undefined);
  const [selectedDetailAccount, setSelectedDetailAccount] = useState<Account | null>(null);
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [quickTradeTargetAccount, setQuickTradeTargetAccount] = useState<string | undefined>(undefined);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hedge Modal States
  const [isPlanHedgeModalOpen, setIsPlanHedgeModalOpen] = useState(false);
  const [planHedgeInitialAcc1Id, setPlanHedgeInitialAcc1Id] = useState<string | undefined>(undefined);
  const [editingPlannedHedge, setEditingPlannedHedge] = useState<PlannedHedge | null>(null);
  const [executeTargetPlan, setExecuteTargetPlan] = useState<PlannedHedge | null>(null);
  const [closeTargetActiveHedge, setCloseTargetActiveHedge] = useState<ActiveHedge | null>(null);

  // Trader Modal State
  const [isTraderModalOpen, setIsTraderModalOpen] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('trading_circle_sidebar_width');
    return saved ? Math.max(56, Math.min(380, parseInt(saved, 10))) : 200;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('trading_circle_sidebar_collapsed') === 'true';
  });

  const effectiveSidebarWidth = isSidebarCollapsed ? 60 : sidebarWidth;

  const handleWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('trading_circle_sidebar_width', newWidth.toString());
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('trading_circle_sidebar_collapsed', next.toString());
      return next;
    });
  };

  // ===================== FIREBASE REAL-TIME SYNC =====================
  useEffect(() => {
    // 1. Initial Firestore check & seeding
    seedInitialFirestoreDataIfEmpty({
      accounts,
      traders,
      expenses,
      plannedHedges,
      activeHedges,
      closedHedges,
      logs,
    }).catch(console.error);

    // 2. Real-time Firestore subscriptions
    const unsubAccounts = subscribeToAccounts((cloudAccounts) => {
      setAccounts(cloudAccounts);
      localStorage.setItem('tc_v5_accounts', JSON.stringify(cloudAccounts));
    });

    const unsubTraders = subscribeToTraders((cloudTraders) => {
      setTraders(cloudTraders);
      localStorage.setItem('tc_v5_traders', JSON.stringify(cloudTraders));
    });

    const unsubExpenses = subscribeToExpenses((cloudExpenses) => {
      setExpenses(cloudExpenses);
      localStorage.setItem('tc_v5_expenses', JSON.stringify(cloudExpenses));
    });

    const unsubPlanned = subscribeToPlannedHedges((cloudPlanned) => {
      setPlannedHedges(cloudPlanned);
      localStorage.setItem('tc_v5_planned_hedges', JSON.stringify(cloudPlanned));
    });

    const unsubActive = subscribeToActiveHedges((cloudActive) => {
      setActiveHedges(cloudActive);
      localStorage.setItem('tc_v5_active_hedges', JSON.stringify(cloudActive));
    });

    const unsubClosed = subscribeToClosedHedges((cloudClosed) => {
      setClosedHedges(cloudClosed);
      localStorage.setItem('tc_v5_closed_hedges', JSON.stringify(cloudClosed));
    });

    const unsubLogs = subscribeToLogs((cloudLogs) => {
      setLogs(cloudLogs);
      localStorage.setItem('tc_v5_logs', JSON.stringify(cloudLogs));
    });

    const unsubMeta = subscribeToMeta((meta) => {
      if (meta.lastUpdatedText) {
        setLastUpdatedText(meta.lastUpdatedText);
        localStorage.setItem('trading_circle_last_updated', meta.lastUpdatedText);
      }
    });

    return () => {
      unsubAccounts();
      unsubTraders();
      unsubExpenses();
      unsubPlanned();
      unsubActive();
      unsubClosed();
      unsubLogs();
      unsubMeta();
    };
  }, []);

  // Compute validated active and planned hedges (where both paired broker accounts exist)
  const validActiveHedges = activeHedges.filter((h) => {
    return accounts.some((a) => a.id === h.account1Id) && accounts.some((a) => a.id === h.account2Id);
  });

  const validPlannedHedges = plannedHedges.filter((p) => {
    return accounts.some((a) => a.id === p.account1Id) && accounts.some((a) => a.id === p.account2Id);
  });

  // Auto-prune orphaned active and planned hedges from Firestore
  useEffect(() => {
    activeHedges.forEach((h) => {
      const hasAcc1 = accounts.some((a) => a.id === h.account1Id);
      const hasAcc2 = accounts.some((a) => a.id === h.account2Id);
      if (!hasAcc1 || !hasAcc2) {
        deleteActiveHedgeFromFirestore(h.id).catch(console.error);
      }
    });

    plannedHedges.forEach((p) => {
      const hasAcc1 = accounts.some((a) => a.id === p.account1Id);
      const hasAcc2 = accounts.some((a) => a.id === p.account2Id);
      if (!hasAcc1 || !hasAcc2) {
        deletePlannedHedgeFromFirestore(p.id).catch(console.error);
      }
    });
  }, [accounts, activeHedges, plannedHedges]);

  // Keyboard Shortcuts (⌘1..6, ⌘B for sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleCollapse();
        return;
      }
      if (isCmdOrCtrl && e.key === '1') {
        e.preventDefault();
        setCurrentTab('dashboard');
      } else if (isCmdOrCtrl && e.key === '2') {
        e.preventDefault();
        setCurrentTab('hedges');
      } else if (isCmdOrCtrl && e.key === '3') {
        e.preventDefault();
        setCurrentTab('traders');
      } else if (isCmdOrCtrl && e.key === '4') {
        e.preventDefault();
        setCurrentTab('accounts');
      } else if (isCmdOrCtrl && e.key === '5') {
        e.preventDefault();
        setCurrentTab('finances');
      } else if (isCmdOrCtrl && e.key === '6') {
        e.preventDefault();
        setCurrentTab('logs');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const formatNow = () => {
    const d = new Date();
    return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getBase10kPctText = (balance: number) => {
    const pct = ((balance - 10000) / 10000) * 100;
    return pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
  };

  // 1. Trader CRUD Handlers
  const handleSaveTrader = (trader: Trader) => {
    const exists = traders.some((t) => t.id === trader.id);
    saveTraderToFirestore(trader).catch(console.error);

    if (exists) {
      setTraders((prev) => prev.map((t) => (t.id === trader.id ? trader : t)));
      accounts.forEach((a) => {
        if (a.accountName === trader.name) {
          const updatedA: Account = { ...a, phone: trader.assignedPhoneSlot, owner: trader.owner };
          saveAccountToFirestore(updatedA).catch(console.error);
        }
      });
      showToast(`Updated profile for ${trader.name}`);
    } else {
      setTraders((prev) => [trader, ...prev]);
      const newLog: AppLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: formatNow(),
        timeAgo: 'Just now',
        actionType: 'ACCOUNT_ADDED',
        title: 'Trader Profile Registered',
        traderName: trader.name,
        broker: 'Thrivers',
        brokerLogo: BROKER_LOGOS['Thrivers'],
        summary: `Registered new trader profile: ${trader.name} (${trader.deviceName}, Assigned Phone ${trader.assignedPhoneSlot}, Owner: ${trader.owner})`,
        changes: [
          { field: 'Device Hardware', from: '-', to: trader.deviceName },
          { field: 'Dashboard Slot', from: '-', to: `Phone ${trader.assignedPhoneSlot}` },
          { field: 'Owner', from: '-', to: trader.owner },
        ],
      };
      setLogs((prev) => [newLog, ...prev]);
      saveLogToFirestore(newLog).catch(console.error);
      showToast(`Registered new trader ${trader.name} (Phone ${trader.assignedPhoneSlot})`);
    }
  };

  const handleDeleteTrader = (traderId: string) => {
    const target = traders.find((t) => t.id === traderId);
    if (target) {
      deleteTraderFromFirestore(traderId).catch(console.error);
      setTraders((prev) => prev.filter((t) => t.id !== traderId));
      showToast(`Removed trader ${target.name}`);
    }
  };

  // 2. Add new account
  const handleAddAccount = (newAcc: Account) => {
    setAccounts((prev) => [newAcc, ...prev]);
    saveAccountToFirestore(newAcc).catch(console.error);

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_ADDED',
      title: 'New Account Connected',
      traderName: newAcc.accountName,
      broker: newAcc.broker,
      brokerLogo: newAcc.brokerLogo,
      accountNumber: newAcc.accountNumber,
      summary: `Connected new ${newAcc.broker} account for ${newAcc.accountName} with initial balance of $${newAcc.accountBalance.toLocaleString()} (${newAcc.phase}, Phone ${newAcc.phone})`,
      changes: [
        { field: 'Initial Balance', from: '-', to: `$${newAcc.accountBalance.toLocaleString()} (${getBase10kPctText(newAcc.accountBalance)})` },
        { field: 'Assigned Device', from: '-', to: `Phone ${newAcc.phone}` },
        { field: 'Trading Phase', from: '-', to: newAcc.phase },
      ],
    };

    setLogs((prev) => [newLog, ...prev]);
    saveLogToFirestore(newLog).catch(console.error);
    recordChangeTimestamp();
    showToast(`Successfully linked ${newAcc.accountName} (${newAcc.broker})`);
  };

  // 2b. Evaluate automatic phase promotion (>= 8% on Phase 1, >= 5% on Phase 2) and breach (<= -10% / <= $9000)
  interface AccountEvaluationResult {
    updatedAccount: Account;
    spawnedAccount?: Account;
    log?: AppLogEntry;
    toast?: string;
  }

  const evaluateAccountPhaseRules = (account: Account): AccountEvaluationResult => {
    if (account.phase === 'Breached' || account.phase === 'Passed') {
      return { updatedAccount: account };
    }

    // 1. Max Drawdown Breach Rule: Balance <= 9000
    if (account.accountBalance <= 9000) {
      const breachedAcc: Account = {
        ...account,
        phase: 'Breached',
        lastSync: 'Hit -10% Max Drawdown (Auto Breached)',
      };
      const log: AppLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: formatNow(),
        timeAgo: 'Just now',
        actionType: 'ACCOUNT_UPDATED',
        title: 'Account Auto-Breached (≤ -10% Limit)',
        traderName: account.accountName,
        broker: account.broker,
        brokerLogo: account.brokerLogo,
        accountNumber: account.accountNumber,
        summary: `${account.accountName} (#${account.accountNumber}) hit $${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (≤ -10% / $9,000 threshold). Automatically marked as Breached and moved to Old Accounts.`,
        changes: [
          { field: 'Phase', from: account.phase, to: 'Breached' },
          { field: 'Limit Trigger', from: 'Active Account', to: 'Max Drawdown Hit (≤ $9,000)' },
        ],
      };
      return {
        updatedAccount: breachedAcc,
        log,
        toast: `⚠️ ${account.accountName} hit $${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (≤ -10%). Marked as Breached & moved to Old Accounts.`,
      };
    }

    // 2. Phase 1 Pass Rule: Balance >= 10800
    if (account.phase === 'Phase 1' && account.accountBalance >= 10800) {
      const passedAcc: Account = {
        ...account,
        phase: 'Passed',
        lastSync: 'Passed Phase 1 (≥ +8% Target)',
      };
      const spawnedPhase2Acc: Account = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        accountName: account.accountName,
        broker: account.broker,
        brokerLogo: account.brokerLogo,
        personName: account.personName,
        owner: account.owner || 'Ismail',
        device: account.device || 'mobile',
        phone: account.phone || 1,
        accountNumber: account.accountNumber,
        accountBalance: 10000,
        equity: 10000,
        dayPnL: 0,
        dayPnLPercent: 0,
        phase: 'Phase 2',
        status: 'ONLINE',
        lastSync: 'Just created (Phase 2)',
        hedgeStatusOverride: null,
      };
      const log: AppLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: formatNow(),
        timeAgo: 'Just now',
        actionType: 'ACCOUNT_UPDATED',
        title: 'Phase 1 Passed (≥ 8% Target) → Phase 2 Created',
        traderName: account.accountName,
        broker: account.broker,
        brokerLogo: account.brokerLogo,
        accountNumber: account.accountNumber,
        summary: `${account.accountName} reached $${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (≥ +8% profit target). Phase 1 auto-marked as Passed. Brand new Phase 2 account generated with fresh $10,000 baseline!`,
        changes: [
          { field: 'Phase Transition', from: 'Phase 1', to: 'Phase 2 (Auto-Created)' },
          { field: 'Starting Capital', from: `$${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, to: '$10,000.00' },
        ],
      };
      return {
        updatedAccount: passedAcc,
        spawnedAccount: spawnedPhase2Acc,
        log,
        toast: `🎉 ${account.accountName} reached $${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (≥ +8%)! Phase 1 Passed. New Phase 2 account created.`,
      };
    }

    // 3. Phase 2 Pass Rule: Balance >= 10500
    if (account.phase === 'Phase 2' && account.accountBalance >= 10500) {
      const passedAcc: Account = {
        ...account,
        phase: 'Passed',
        lastSync: 'Passed Phase 2 (≥ +5% Target)',
      };
      const spawnedLiveAcc: Account = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        accountName: account.accountName,
        broker: account.broker,
        brokerLogo: account.brokerLogo,
        personName: account.personName,
        owner: account.owner || 'Ismail',
        device: account.device || 'mobile',
        phone: account.phone || 1,
        accountNumber: account.accountNumber,
        accountBalance: 10000,
        equity: 10000,
        dayPnL: 0,
        dayPnLPercent: 0,
        phase: 'Live',
        status: 'ONLINE',
        lastSync: 'Just created (Live Funded)',
        hedgeStatusOverride: null,
      };
      const log: AppLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: formatNow(),
        timeAgo: 'Just now',
        actionType: 'ACCOUNT_UPDATED',
        title: 'Phase 2 Passed (≥ 5% Target) → Live Funded Created',
        traderName: account.accountName,
        broker: account.broker,
        brokerLogo: account.brokerLogo,
        accountNumber: account.accountNumber,
        summary: `${account.accountName} reached $${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (≥ +5% profit target). Phase 2 auto-marked as Passed. Brand new Live funded account generated with fresh $10,000 baseline!`,
        changes: [
          { field: 'Phase Transition', from: 'Phase 2', to: 'Live Account (Funded)' },
          { field: 'Starting Capital', from: `$${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, to: '$10,000.00' },
        ],
      };
      return {
        updatedAccount: passedAcc,
        spawnedAccount: spawnedLiveAcc,
        log,
        toast: `🚀 ${account.accountName} reached $${account.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} (≥ +5%)! Phase 2 Passed. New Live account created.`,
      };
    }

    return { updatedAccount: account };
  };

  // 3. Update existing account
  const handleUpdateAccount = (updatedAcc: Account) => {
    const prevAcc = accounts.find((a) => a.id === updatedAcc.id);
    const changes: LogFieldChange[] = [];

    if (prevAcc) {
      if (prevAcc.accountBalance !== updatedAcc.accountBalance) {
        changes.push({
          field: 'Balance',
          from: `$${prevAcc.accountBalance.toLocaleString()}`,
          to: `$${updatedAcc.accountBalance.toLocaleString()} (${getBase10kPctText(updatedAcc.accountBalance)})`,
        });
      }
      if (prevAcc.phase !== updatedAcc.phase) {
        changes.push({
          field: 'Phase',
          from: prevAcc.phase,
          to: updatedAcc.phase,
        });
      }
      if (prevAcc.phone !== updatedAcc.phone) {
        changes.push({
          field: 'Device',
          from: `Phone ${prevAcc.phone}`,
          to: `Phone ${updatedAcc.phone}`,
        });
      }
      if (prevAcc.accountName !== updatedAcc.accountName) {
        changes.push({
          field: 'Trader Name',
          from: prevAcc.accountName,
          to: updatedAcc.accountName,
        });
      }
      if (prevAcc.broker !== updatedAcc.broker) {
        changes.push({
          field: 'Broker',
          from: prevAcc.broker,
          to: updatedAcc.broker,
        });
      }
    }

    const evalResult = evaluateAccountPhaseRules(updatedAcc);
    const finalUpdatedAcc = evalResult.updatedAccount;

    const isBalanceOnly = changes.length === 1 && changes[0].field === 'Balance';
    const isBalanceChanged = changes.some((c) => c.field === 'Balance');

    const summaryParts: string[] = [];
    if (isBalanceChanged) {
      summaryParts.push(`Balance updated to $${finalUpdatedAcc.accountBalance.toLocaleString()} (${getBase10kPctText(finalUpdatedAcc.accountBalance)})`);
    }
    if (prevAcc && prevAcc.phase !== finalUpdatedAcc.phase) {
      summaryParts.push(`Phase changed from ${prevAcc.phase} to ${finalUpdatedAcc.phase}`);
    }
    if (prevAcc && prevAcc.phone !== finalUpdatedAcc.phone) {
      summaryParts.push(`Assigned to Phone ${finalUpdatedAcc.phone}`);
    }
    if (prevAcc && prevAcc.accountName !== finalUpdatedAcc.accountName) {
      summaryParts.push(`Renamed to ${finalUpdatedAcc.accountName}`);
    }

    const summaryText = summaryParts.length > 0
      ? summaryParts.join(' • ')
      : `Updated profile details for ${finalUpdatedAcc.accountName}`;

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: isBalanceOnly ? 'BALANCE_CHANGED' : 'ACCOUNT_UPDATED',
      title: isBalanceOnly ? 'Balance Updated' : 'Account Details Updated',
      traderName: finalUpdatedAcc.accountName,
      broker: finalUpdatedAcc.broker,
      brokerLogo: finalUpdatedAcc.brokerLogo,
      accountNumber: finalUpdatedAcc.accountNumber,
      summary: summaryText,
      changes: changes.length > 0 ? changes : undefined,
    };

    saveAccountToFirestore(finalUpdatedAcc).catch(console.error);
    if (evalResult.spawnedAccount) {
      saveAccountToFirestore(evalResult.spawnedAccount).catch(console.error);
    }
    if (evalResult.log) {
      saveLogToFirestore(evalResult.log).catch(console.error);
    }
    saveLogToFirestore(newLog).catch(console.error);

    setAccounts((prev) => {
      let nextList = prev.map((a) => (a.id === finalUpdatedAcc.id ? finalUpdatedAcc : a));
      if (evalResult.spawnedAccount) {
        nextList = [evalResult.spawnedAccount, ...nextList];
      }
      return nextList;
    });

    const logsToAdd: AppLogEntry[] = [];
    if (evalResult.log) logsToAdd.push(evalResult.log);
    logsToAdd.push(newLog);
    setLogs((prev) => [...logsToAdd, ...prev]);

    recordChangeTimestamp();

    if (evalResult.toast) {
      showToast(evalResult.toast);
    } else {
      showToast(`Saved updates for ${finalUpdatedAcc.accountName}`);
    }
  };

  // 3b. Overwrite account hedge status
  const handleUpdateAccountHedgeStatus = (
    accountId: string,
    newStatus: AccountHedgeStatus | 'Auto'
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    const overrideValue = newStatus === 'Auto' ? null : newStatus;
    const updatedAcc: Account = {
      ...target,
      hedgeStatusOverride: overrideValue,
    };

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_UPDATED',
      title: 'Hedge State Updated',
      traderName: target.accountName,
      broker: target.broker,
      brokerLogo: target.brokerLogo,
      accountNumber: target.accountNumber,
      summary: `Set hedge state for ${target.accountName} to "${newStatus === 'Auto' ? 'Auto (Calculated)' : newStatus}"`,
      changes: [
        {
          field: 'Hedge Status',
          from: target.hedgeStatusOverride || 'Auto',
          to: newStatus,
        },
      ],
    };

    saveAccountToFirestore(updatedAcc).catch(console.error);
    saveLogToFirestore(newLog).catch(console.error);

    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? updatedAcc : a))
    );
    setLogs((prev) => [newLog, ...prev]);
    recordChangeTimestamp();
    showToast(`Updated status for ${target.accountName} to ${newStatus}`);
  };

  // 3c. Mark account breached
  const handleMarkAccountBreached = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    const updatedAcc: Account = {
      ...target,
      phase: 'Breached',
      lastSync: 'Marked Breached',
    };

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_UPDATED',
      title: 'Account Breached',
      traderName: target.accountName,
      broker: target.broker,
      brokerLogo: target.brokerLogo,
      accountNumber: target.accountNumber,
      summary: `Account ${target.accountName} (#${target.accountNumber}) marked as Breached. Moved to Old Accounts.`,
      changes: [
        {
          field: 'Phase',
          from: target.phase,
          to: 'Breached',
        },
      ],
    };

    saveAccountToFirestore(updatedAcc).catch(console.error);
    saveLogToFirestore(newLog).catch(console.error);

    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? updatedAcc : a))
    );
    setLogs((prev) => [newLog, ...prev]);
    recordChangeTimestamp();
    showToast(`${target.accountName} marked as Breached (Moved to Old Accounts)`);
  };

  // 3d. Mark account passed & auto-create next phase account
  const handleMarkAccountPassed = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    if (target.phase === 'Live') {
      showToast('Live accounts cannot be marked as passed (only breached).');
      return;
    }

    const nextPhase: AccountPhase = target.phase === 'Phase 1' ? 'Phase 2' : 'Live';

    const passedAcc: Account = {
      ...target,
      phase: 'Passed',
      lastSync: 'Marked Passed',
    };

    const newAccId = `acc-${Date.now()}`;
    const upgradedAcc: Account = {
      id: newAccId,
      accountName: target.accountName,
      broker: target.broker,
      brokerLogo: target.brokerLogo,
      personName: target.personName,
      owner: target.owner || 'Ismail',
      device: target.device || 'mobile',
      phone: target.phone || 1,
      accountNumber: target.accountNumber,
      accountBalance: 10000,
      equity: 10000,
      dayPnL: 0,
      dayPnLPercent: 0,
      phase: nextPhase,
      status: 'ONLINE',
      lastSync: 'Just created',
      hedgeStatusOverride: null,
    };

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_UPDATED',
      title: 'Account Passed & Upgraded',
      traderName: target.accountName,
      broker: target.broker,
      brokerLogo: target.brokerLogo,
      accountNumber: target.accountNumber,
      summary: `${target.accountName} passed ${target.phase}! New ${nextPhase} account created with $10,000 baseline.`,
      changes: [
        {
          field: 'Phase Transition',
          from: target.phase,
          to: `${nextPhase} (New Account Created)`,
        },
      ],
    };

    saveAccountToFirestore(passedAcc).catch(console.error);
    saveAccountToFirestore(upgradedAcc).catch(console.error);
    saveLogToFirestore(newLog).catch(console.error);

    setAccounts((prev) => [
      upgradedAcc,
      ...prev.map((a) => (a.id === accountId ? passedAcc : a)),
    ]);
    setLogs((prev) => [newLog, ...prev]);
    recordChangeTimestamp();
    showToast(`${target.accountName} Passed! Created new ${nextPhase} account.`);
  };

  // 4. Delete account
  const handleDeleteAccount = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      deleteAccountFromFirestore(accountId).catch(console.error);
      const newLog: AppLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: formatNow(),
        timeAgo: 'Just now',
        actionType: 'ACCOUNT_DELETED',
        title: 'Account Disconnected',
        traderName: target.accountName,
        broker: target.broker,
        brokerLogo: target.brokerLogo,
        accountNumber: target.accountNumber,
        summary: `Disconnected and removed ${target.broker} account (${target.accountName} #${target.accountNumber})`,
      };
      setLogs((prev) => [newLog, ...prev]);
      saveLogToFirestore(newLog).catch(console.error);
      recordChangeTimestamp();
      showToast(`Disconnected ${target.accountName}`);
    }
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
  };

  // 5. Sync specific account
  const handleSyncAccount = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (target) {
      const updated: Account = { ...target, lastSync: 'Just now', status: 'ONLINE' };
      saveAccountToFirestore(updated).catch(console.error);
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? updated : a))
      );
    }
    showToast(`Account synchronized with custodian.`);
  };

  // 6. Mass sync all accounts
  const handleSyncAllAccounts = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setAccounts((prev) => {
        const synced = prev.map((a) => ({
          ...a,
          lastSync: 'Just now',
          status: 'ONLINE' as const,
        }));
        synced.forEach((a) => saveAccountToFirestore(a).catch(console.error));
        return synced;
      });
      setIsSyncingAll(false);
      showToast(`All ${accounts.length} broker accounts synchronized.`);
    }, 600);
  };

  // 7. Clear logs
  const handleClearLogs = () => {
    setLogs([]);
    showToast('Activity logs cleared.');
  };

  // 8. Execute quick manual trade
  const handleExecuteTrade = (trade: {
    accountName: string;
    type: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    price: number;
  }) => {
    const isBroadcast = trade.accountName === 'ALL ACCOUNTS';

    setAccounts((prev) =>
      prev.map((a) => {
        if (isBroadcast || a.accountName === trade.accountName) {
          const delta = trade.type === 'BUY' ? 250 : -150;
          const updated: Account = {
            ...a,
            dayPnL: Number((a.dayPnL + delta).toFixed(2)),
            equity: Number((a.equity + (trade.type === 'BUY' ? delta : -delta)).toFixed(2)),
            lastSync: 'Just now',
            openPositionsCount: (a.openPositionsCount || 0) + 1,
          };
          saveAccountToFirestore(updated).catch(console.error);
          return updated;
        }
        return a;
      })
    );

    showToast(
      `Order Executed: ${trade.type} ${trade.quantity} ${trade.symbol} @ $${trade.price.toFixed(2)} (${isBroadcast ? 'All Accounts' : trade.accountName})`
    );
  };

  // ===================== HEDGE MANAGEMENT HANDLERS =====================

  const handleSavePlannedHedge = (
    planData: Omit<PlannedHedge, 'id' | 'createdAt'>,
    planId?: string
  ) => {
    if (planId) {
      const existing = plannedHedges.find((p) => p.id === planId);
      const updated: PlannedHedge = {
        ...planData,
        id: planId,
        createdAt: existing?.createdAt || formatNow(),
      };
      savePlannedHedgeToFirestore(updated).catch(console.error);
      setPlannedHedges((prev) =>
        prev.map((p) => (p.id === planId ? updated : p))
      );
      showToast(`Updated hedge plan for ${planData.instrument}`);
    } else {
      const newPlan: PlannedHedge = {
        ...planData,
        id: `plan-${Date.now()}`,
        createdAt: formatNow(),
      };
      savePlannedHedgeToFirestore(newPlan).catch(console.error);
      setPlannedHedges((prev) => [newPlan, ...prev]);
      showToast(`Added ${planData.instrument} to tomorrow's hedge plan`);
    }
  };

  const handleDeletePlannedHedge = (planId: string) => {
    deletePlannedHedgeFromFirestore(planId).catch(console.error);
    setPlannedHedges((prev) => prev.filter((p) => p.id !== planId));
    showToast('Removed hedge plan.');
  };

  const handleStartActiveHedge = (activeHedge: ActiveHedge) => {
    saveActiveHedgeToFirestore(activeHedge).catch(console.error);
    setActiveHedges((prev) => [activeHedge, ...prev]);

    const matchingPlans = plannedHedges.filter(
      (p) =>
        p.instrument === activeHedge.instrument &&
        ((p.account1Id === activeHedge.account1Id && p.account2Id === activeHedge.account2Id) ||
          (p.account1Id === activeHedge.account2Id && p.account2Id === activeHedge.account1Id))
    );
    matchingPlans.forEach((p) => deletePlannedHedgeFromFirestore(p.id).catch(console.error));

    setPlannedHedges((prev) =>
      prev.filter(
        (p) =>
          !(
            p.instrument === activeHedge.instrument &&
            ((p.account1Id === activeHedge.account1Id && p.account2Id === activeHedge.account2Id) ||
              (p.account1Id === activeHedge.account2Id && p.account2Id === activeHedge.account1Id))
          )
      )
    );

    const acc1 = accounts.find((a) => a.id === activeHedge.account1Id);
    const acc2 = accounts.find((a) => a.id === activeHedge.account2Id);

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_UPDATED',
      title: 'Hedge Executed & Running',
      traderName: `${acc1?.accountName || 'Acc 1'} ⇄ ${acc2?.accountName || 'Acc 2'}`,
      broker: acc1?.broker || 'Thrivers',
      brokerLogo: acc1?.brokerLogo || BROKER_LOGOS['Thrivers'],
      summary: `Started live ${activeHedge.instrument} hedge: ${acc1?.accountName} (${activeHedge.account1Side} ${activeHedge.account1LotSize}L) vs ${acc2?.accountName} (${activeHedge.account2Side} ${activeHedge.account2LotSize}L)`,
      changes: [
        { field: 'Instrument', from: 'Planned', to: activeHedge.instrument },
        { field: `${acc1?.accountName} Position`, from: 'Flat', to: `${activeHedge.account1Side} ${activeHedge.account1LotSize} Lots` },
        { field: `${acc2?.accountName} Position`, from: 'Flat', to: `${activeHedge.account2Side} ${activeHedge.account2LotSize} Lots` },
      ],
    };

    saveLogToFirestore(newLog).catch(console.error);
    setLogs((prev) => [newLog, ...prev]);
    showToast(`Live hedge started on ${activeHedge.instrument}!`);
  };

  const handleConfirmCloseHedge = (
    hedge: ActiveHedge,
    closeBalance1: number,
    closeBalance2: number,
    closeNotes?: string
  ) => {
    const acc1 = accounts.find((a) => a.id === hedge.account1Id);
    const acc2 = accounts.find((a) => a.id === hedge.account2Id);

    if (!acc1 || !acc2) return;

    const pnl1 = Number((closeBalance1 - hedge.account1StartBalance).toFixed(2));
    const pnl2 = Number((closeBalance2 - hedge.account2StartBalance).toFixed(2));
    const netPnL = Number((pnl1 + pnl2).toFixed(2));

    const diffMs = Math.max(0, Date.now() - hedge.startedTimestamp);
    const mins = Math.floor(diffMs / 60000);
    const durationText = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

    const candidateAcc1: Account = {
      ...acc1,
      accountBalance: closeBalance1,
      equity: Number((acc1.equity + pnl1).toFixed(2)),
      dayPnL: Number((acc1.dayPnL + pnl1).toFixed(2)),
      lastSync: 'Just now',
    };

    const candidateAcc2: Account = {
      ...acc2,
      accountBalance: closeBalance2,
      equity: Number((acc2.equity + pnl2).toFixed(2)),
      dayPnL: Number((acc2.dayPnL + pnl2).toFixed(2)),
      lastSync: 'Just now',
    };

    const eval1 = evaluateAccountPhaseRules(candidateAcc1);
    const eval2 = evaluateAccountPhaseRules(candidateAcc2);

    const finalAcc1 = eval1.updatedAccount;
    const finalAcc2 = eval2.updatedAccount;

    const spawnedAccounts: Account[] = [];
    if (eval1.spawnedAccount) spawnedAccounts.push(eval1.spawnedAccount);
    if (eval2.spawnedAccount) spawnedAccounts.push(eval2.spawnedAccount);

    saveAccountToFirestore(finalAcc1).catch(console.error);
    saveAccountToFirestore(finalAcc2).catch(console.error);
    spawnedAccounts.forEach((sp) => saveAccountToFirestore(sp).catch(console.error));

    setAccounts((prev) => {
      let nextList = prev.map((acc) => {
        if (acc.id === acc1.id) return finalAcc1;
        if (acc.id === acc2.id) return finalAcc2;
        return acc;
      });
      if (spawnedAccounts.length > 0) {
        nextList = [...spawnedAccounts, ...nextList];
      }
      return nextList;
    });

    const closedEntry: ClosedHedge = {
      id: `closed-${Date.now()}`,
      instrument: hedge.instrument,
      account1Id: acc1.id,
      account1Name: acc1.accountName,
      account1Broker: acc1.broker,
      account1Phone: acc1.phone,
      account1Side: hedge.account1Side,
      account1LotSize: hedge.account1LotSize,
      account1StartBalance: hedge.account1StartBalance,
      account1CloseBalance: closeBalance1,
      account1PnL: pnl1,
      account2Id: acc2.id,
      account2Name: acc2.accountName,
      account2Broker: acc2.broker,
      account2Phone: acc2.phone,
      account2Side: hedge.account2Side,
      account2LotSize: hedge.account2LotSize,
      account2StartBalance: hedge.account2StartBalance,
      account2CloseBalance: closeBalance2,
      account2PnL: pnl2,
      netPnL,
      startedAt: hedge.startedAt,
      closedAt: formatNow(),
      durationText,
      notes: closeNotes || hedge.notes,
    };

    saveClosedHedgeToFirestore(closedEntry).catch(console.error);
    deleteActiveHedgeFromFirestore(hedge.id).catch(console.error);

    setClosedHedges((prev) => [closedEntry, ...prev]);
    setActiveHedges((prev) => prev.filter((h) => h.id !== hedge.id));
    recordChangeTimestamp();

    const pnl1Str = pnl1 >= 0 ? `+$${pnl1.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(pnl1).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const pnl2Str = pnl2 >= 0 ? `+$${pnl2.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(pnl2).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const netStr = netPnL >= 0 ? `+$${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-$${Math.abs(netPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'BALANCE_CHANGED',
      title: 'Hedge Settled & Balances Updated',
      traderName: `${acc1.accountName} ⇄ ${acc2.accountName}`,
      broker: acc1.broker,
      brokerLogo: acc1.brokerLogo,
      summary: `Settled ${hedge.instrument} hedge: ${acc1.accountName} (${pnl1Str}), ${acc2.accountName} (${pnl2Str}). Combined Net Result: ${netStr}`,
      changes: [
        {
          field: `${acc1.accountName} (${acc1.broker}) Balance`,
          from: `$${hedge.account1StartBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          to: `$${closeBalance1.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pnl1Str})`,
        },
        {
          field: `${acc2.accountName} (${acc2.broker}) Balance`,
          from: `$${hedge.account2StartBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          to: `$${closeBalance2.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pnl2Str})`,
        },
        {
          field: 'Combined Net Hedge PnL',
          from: '$0.00',
          to: netStr,
        },
      ],
    };

    const extraLogs: AppLogEntry[] = [];
    if (eval1.log) {
      extraLogs.push(eval1.log);
      saveLogToFirestore(eval1.log).catch(console.error);
    }
    if (eval2.log) {
      extraLogs.push(eval2.log);
      saveLogToFirestore(eval2.log).catch(console.error);
    }
    saveLogToFirestore(newLog).catch(console.error);

    setLogs((prev) => [...extraLogs, newLog, ...prev]);

    if (eval1.toast && eval2.toast) {
      showToast(`${eval1.toast} | ${eval2.toast}`);
    } else if (eval1.toast) {
      showToast(eval1.toast);
    } else if (eval2.toast) {
      showToast(eval2.toast);
    } else {
      showToast(`Hedge settled! Net result: ${netStr}. All balances updated.`);
    }
  };

  // Expense Handlers
  const handleAddExpense = (newExp: ExpenseItem) => {
    saveExpenseToFirestore(newExp).catch(console.error);
    setExpenses((prev) => [newExp, ...prev]);
    recordChangeTimestamp();
    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_UPDATED',
      title: `Expense Logged: ${newExp.title}`,
      traderName: newExp.traderName || newExp.accountName || `${newExp.paidBy} (Owner)`,
      broker: 'Thrivers',
      brokerLogo: BROKER_LOGOS['Thrivers'],
      summary: `${newExp.amount.toLocaleString()} ${newExp.currency} expense logged by ${newExp.paidBy}`,
      changes: [
        {
          field: 'Finance Ledger',
          from: '—',
          to: `${newExp.amount.toLocaleString()} ${newExp.currency} (${newExp.paidBy})`,
        },
      ],
    };
    saveLogToFirestore(newLog).catch(console.error);
    setLogs((prev) => [newLog, ...prev]);
    showToast(`Expense recorded: ${newExp.amount.toLocaleString()} ${newExp.currency} (${newExp.paidBy})`);
  };

  const handleUpdateExpense = (updatedExp: ExpenseItem) => {
    saveExpenseToFirestore(updatedExp).catch(console.error);
    setExpenses((prev) => prev.map((e) => (e.id === updatedExp.id ? updatedExp : e)));
    recordChangeTimestamp();
    showToast(`Updated expense: ${updatedExp.title}`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const target = expenses.find((e) => e.id === expenseId);
    deleteExpenseFromFirestore(expenseId).catch(console.error);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    recordChangeTimestamp();
    if (target) {
      showToast(`Deleted expense: ${target.title}`);
    }
  };

  const handleBatchAddExpenses = (newExpenses: ExpenseItem[]) => {
    newExpenses.forEach((exp) => saveExpenseToFirestore(exp).catch(console.error));
    setExpenses((prev) => [...newExpenses, ...prev]);
    recordChangeTimestamp();
    const totalAmount = newExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const currency = newExpenses[0]?.currency || 'PKR';
    const payer = newExpenses[0]?.paidBy || 'Hamza';
    const newLog: AppLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: formatNow(),
      timeAgo: 'Just now',
      actionType: 'ACCOUNT_UPDATED',
      title: `Batch Renewed ${newExpenses.length} Phone SIM Packages`,
      traderName: 'Trader Phones (All)',
      broker: 'Thrivers',
      brokerLogo: BROKER_LOGOS['Thrivers'],
      summary: `Total ${totalAmount.toLocaleString()} ${currency} paid by ${payer} for ${newExpenses.length} SIM packages`,
      changes: [
        {
          field: 'Phone Packages',
          from: '—',
          to: `${newExpenses.length} SIM renewals (${totalAmount.toLocaleString()} ${currency})`,
        },
      ],
    };
    saveLogToFirestore(newLog).catch(console.error);
    setLogs((prev) => [newLog, ...prev]);
    showToast(`Batch renewed ${newExpenses.length} phone packages (Total: Rs ${totalAmount.toLocaleString()} ${currency})`);
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'hedges':
        return 'Hedge Manager';
      case 'traders':
        return 'Trader Profiles';
      case 'accounts':
        return 'Broker Accounts';
      case 'finances':
        return 'Finances & Expense Ledger';
      case 'logs':
        return 'Activity Logs';
      default:
        return 'Dashboard';
    }
  };

  const existingPhoneSlots = traders.map((t) => t.assignedPhoneSlot || 1);

  const handleResetAllData = async () => {
    if (window.confirm('Are you sure you want to reset all data? This will completely clear all cloud database collections (accounts, traders, devices, expenses, logs, and hedges) for a fresh start.')) {
      try {
        await clearAllCollectionsFromFirestore();
      } catch (e) {
        console.error('Failed to clear cloud collections:', e);
      }

      setAccounts([]);
      setTraders([]);
      setExpenses([]);
      setPlannedHedges([]);
      setActiveHedges([]);
      setClosedHedges([]);
      setLogs([]);
      try {
        localStorage.removeItem('tc_v5_accounts');
        localStorage.removeItem('tc_v5_traders');
        localStorage.removeItem('tc_v5_expenses');
        localStorage.removeItem('tc_v5_logs');
        localStorage.removeItem('tc_v5_planned_hedges');
        localStorage.removeItem('tc_v5_active_hedges');
        localStorage.removeItem('tc_v5_closed_hedges');
      } catch (e) {}
      recordChangeTimestamp();
      showToast('All accounts, devices, expenses, and hedges have been cleared from cloud & local storage.');
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full min-h-0 overflow-hidden bg-[#F1F3F5] text-[#1A1C1E] font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          id="toast-banner"
          className="fixed bottom-4 right-4 z-50 bg-white border border-[#DEE2E6] text-slate-800 px-3.5 py-2.5 rounded shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 text-xs font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-700 ml-1.5 text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* SideNavBar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onOpenConnectModal={() => {
          setConnectModalInitialTraderId(undefined);
          setIsConnectModalOpen(true);
        }}
        activeAccountsCount={accounts.length}
        activeHedgesCount={validActiveHedges.length}
        plannedHedgesCount={validPlannedHedges.length}
        tradersCount={traders.length}
        expensesCount={expenses.length}
        logsCount={logs.length}
        width={sidebarWidth}
        isCollapsed={isSidebarCollapsed}
        onWidthChange={handleWidthChange}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden transition-[margin-left,width] duration-150"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : `${effectiveSidebarWidth}px`,
          maxWidth: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `calc(100% - ${effectiveSidebarWidth}px)`,
        }}
      >
        <TopAppBar
          title={getPageTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenQuickTrade={() => {
            setQuickTradeTargetAccount(undefined);
            setIsQuickTradeOpen(true);
          }}
          onToggleMobileMenu={() => setIsOpenMobile(true)}
          onResetAllData={handleResetAllData}
          unreadNotificationsCount={0}
          lastUpdatedText={lastUpdatedText}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleCollapse}
        />

        <NotificationsPopover
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onClearAll={() => {
            setIsNotificationsOpen(false);
            showToast('All notifications marked as read');
          }}
        />

        {/* Dynamic Views */}
        {currentTab === 'dashboard' && (
          <DashboardView
            accounts={accounts}
            plannedHedges={plannedHedges}
            activeHedges={activeHedges}
            onUpdateAccountHedgeStatus={handleUpdateAccountHedgeStatus}
            onViewAllAccounts={() => setCurrentTab('accounts')}
            onSelectAccount={(acc) => setSelectedDetailAccount(acc)}
            onOpenQuickTrade={() => {
              setQuickTradeTargetAccount(undefined);
              setIsQuickTradeOpen(true);
            }}
            onOpenConnectModal={() => {
              setConnectModalInitialTraderId(undefined);
              setIsConnectModalOpen(true);
            }}
            onPlanHedgeWithAccount={(acc) => {
              setPlanHedgeInitialAcc1Id(acc.id);
              setEditingPlannedHedge(null);
              setIsPlanHedgeModalOpen(true);
            }}
            onNavigateToHedges={() => setCurrentTab('hedges')}
            onNavigateToTraders={() => setCurrentTab('traders')}
            activeHedgesCount={validActiveHedges.length}
            plannedHedgesCount={validPlannedHedges.length}
            tradersCount={traders.length}
          />
        )}

        {currentTab === 'hedges' && (
          <HedgeManagerView
            accounts={accounts}
            plannedHedges={plannedHedges}
            activeHedges={activeHedges}
            closedHedges={closedHedges}
            onOpenPlanModal={(initialAccId, editPlan) => {
              setPlanHedgeInitialAcc1Id(initialAccId);
              setEditingPlannedHedge(editPlan || null);
              setIsPlanHedgeModalOpen(true);
            }}
            onOpenExecuteModal={(plan) => setExecuteTargetPlan(plan)}
            onOpenCloseModal={(hedge) => setCloseTargetActiveHedge(hedge)}
            onDeletePlan={handleDeletePlannedHedge}
          />
        )}

        {currentTab === 'traders' && (
          <TradersView
            traders={traders}
            accounts={accounts}
            onOpenAddTrader={() => {
              setEditingTrader(null);
              setIsTraderModalOpen(true);
            }}
            onEditTrader={(trader) => {
              setEditingTrader(trader);
              setIsTraderModalOpen(true);
            }}
            onDeleteTrader={handleDeleteTrader}
            onConnectAccountForTrader={(trader) => {
              setConnectModalInitialTraderId(trader.id);
              setIsConnectModalOpen(true);
            }}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            searchQuery={searchQuery}
            onOpenConnectModal={() => {
              setConnectModalInitialTraderId(undefined);
              setIsConnectModalOpen(true);
            }}
            onSyncAllAccounts={handleSyncAllAccounts}
            onDeleteAccount={handleDeleteAccount}
            onUpdateAccount={handleUpdateAccount}
            onSyncAccount={handleSyncAccount}
            isSyncingAll={isSyncingAll}
          />
        )}

        {currentTab === 'finances' && (
          <FinancesView
            expenses={expenses}
            traders={traders}
            accounts={accounts}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onBatchAddExpenses={handleBatchAddExpenses}
          />
        )}

        {currentTab === 'logs' && (
          <LogsView
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        )}
      </div>

      {/* Modal: Connect Broker Account */}
      <ConnectBrokerModal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          setConnectModalInitialTraderId(undefined);
        }}
        onAddAccount={handleAddAccount}
        onAddExpense={handleAddExpense}
        traders={traders}
        initialSelectedTraderId={connectModalInitialTraderId}
        onOpenCreateTrader={() => {
          setEditingTrader(null);
          setIsTraderModalOpen(true);
        }}
      />

      {/* Modal: Trader Profile Create / Edit */}
      <TraderModal
        isOpen={isTraderModalOpen}
        onClose={() => {
          setIsTraderModalOpen(false);
          setEditingTrader(null);
        }}
        onSaveTrader={handleSaveTrader}
        editingTrader={editingTrader}
        existingPhoneSlots={existingPhoneSlots}
      />

      {/* Modal: Account Detail Inspection */}
      <AccountDetailModal
        account={selectedDetailAccount}
        isOpen={!!selectedDetailAccount}
        onClose={() => setSelectedDetailAccount(null)}
        onSyncAccount={handleSyncAccount}
        onDeleteAccount={handleDeleteAccount}
        onMarkBreached={handleMarkAccountBreached}
        onMarkPassed={handleMarkAccountPassed}
      />

      {/* Modal: Quick Order Sync */}
      <QuickTradeModal
        isOpen={isQuickTradeOpen}
        onClose={() => setIsQuickTradeOpen(false)}
        accounts={accounts}
        targetAccountName={quickTradeTargetAccount}
        onExecuteTrade={handleExecuteTrade}
      />

      {/* Modal: Team & Sync Permissions */}
      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />

      {/* Modal: Plan Hedge for Tomorrow */}
      <PlanHedgeModal
        isOpen={isPlanHedgeModalOpen}
        onClose={() => {
          setIsPlanHedgeModalOpen(false);
          setEditingPlannedHedge(null);
          setPlanHedgeInitialAcc1Id(undefined);
        }}
        accounts={accounts}
        onSavePlan={handleSavePlannedHedge}
        initialAccount1Id={planHedgeInitialAcc1Id}
        editingPlan={editingPlannedHedge}
      />

      {/* Modal: Execute Hedge (Pick BUY / SELL) */}
      <ExecuteHedgeModal
        isOpen={!!executeTargetPlan}
        onClose={() => setExecuteTargetPlan(null)}
        plan={executeTargetPlan}
        accounts={accounts}
        onStartHedge={handleStartActiveHedge}
      />

      {/* Modal: Close & Settle Active Hedge */}
      <CloseHedgeModal
        isOpen={!!closeTargetActiveHedge}
        onClose={() => setCloseTargetActiveHedge(null)}
        hedge={closeTargetActiveHedge}
        accounts={accounts}
        onConfirmClose={handleConfirmCloseHedge}
      />
    </div>
  );
}
