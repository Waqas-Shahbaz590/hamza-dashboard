export type BrokerName = 
  | 'Thrivers'
  | 'Fundpips';

export type AccountPhase = 'Live' | 'Phase 1' | 'Phase 2' | 'Passed' | 'Breached';
export type DeviceType = 'desktop' | 'mobile';
export type AccountOwner = 'Ismail' | 'Hamza';

export type AccountHedgeStatus = 'Hedge Tomorrow' | 'On Hold' | 'Kachra' | 'Running';

export interface Account {
  id: string;
  accountName: string;
  broker: BrokerName;
  brokerLogo: string;
  personName: string;
  owner?: AccountOwner;
  device?: DeviceType;
  phone: number;
  accountNumber: string;
  accountBalance: number;
  equity: number;
  dayPnL: number;
  dayPnLPercent: number;
  phase: AccountPhase;
  status: 'ONLINE' | 'SYNCING' | 'DISCONNECTED';
  lastSync: string;
  serverNode?: string;
  openPositionsCount?: number;
  leverage?: string;
  hedgeStatusOverride?: AccountHedgeStatus | 'Auto' | null;
}

export interface PlannedHedge {
  id: string;
  instrument: string;
  account1Id: string;
  account2Id: string;
  plannedLotSize?: number;
  notes?: string;
  createdAt: string;
  targetDate?: string;
  scheduledDate?: string; // 'YYYY-MM-DD'
}

export interface ActiveHedge {
  id: string;
  instrument: string;
  account1Id: string;
  account1Side: 'BUY' | 'SELL';
  account1LotSize: number;
  account1StartBalance: number;
  account2Id: string;
  account2Side: 'BUY' | 'SELL';
  account2LotSize: number;
  account2StartBalance: number;
  startedAt: string;
  startedTimestamp: number;
  notes?: string;
}

export interface ClosedHedge {
  id: string;
  instrument: string;
  account1Id: string;
  account1Name: string;
  account1Broker: BrokerName;
  account1Phone: number;
  account1Side: 'BUY' | 'SELL';
  account1LotSize: number;
  account1StartBalance: number;
  account1CloseBalance: number;
  account1PnL: number;
  account2Id: string;
  account2Name: string;
  account2Broker: BrokerName;
  account2Phone: number;
  account2Side: 'BUY' | 'SELL';
  account2LotSize: number;
  account2StartBalance: number;
  account2CloseBalance: number;
  account2PnL: number;
  netPnL: number;
  startedAt: string;
  closedAt: string;
  durationText?: string;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  accountName: string;
  type: 'BUY' | 'SELL' | 'SYNC' | 'ALERT';
  text: string;
  symbol?: string;
  quantity?: number;
  price?: number;
  timeAgo: string;
  dotColor: 'tertiary' | 'error' | 'outline-variant' | 'primary';
  timestamp: string;
}

export interface LogFieldChange {
  field: string;
  from: string | number;
  to: string | number;
}

export type LogActionType = 
  | 'ACCOUNT_ADDED' 
  | 'ACCOUNT_UPDATED' 
  | 'ACCOUNT_DELETED' 
  | 'BALANCE_CHANGED';

export interface AppLogEntry {
  id: string;
  timestamp: string;
  timeAgo: string;
  actionType: LogActionType;
  title: string;
  traderName: string;
  broker: BrokerName;
  brokerLogo: string;
  summary: string;
  accountNumber?: string;
  changes?: LogFieldChange[];
}

export interface BrokerSyncHealth {
  broker: BrokerName;
  status: 'operational' | 'degraded' | 'syncing';
  latencyMs: number;
  activeAccounts: number;
  totalVolume: number;
}

export interface ServerHostingConfig {
  serverName: string;
  hostIp: string;
  port: number;
  region: string;
  sslActive: boolean;
  syncIntervalSec: number;
  webhookEndpoint: string;
  uptime: string;
  activeSockets: number;
  latencyAvg: number;
  autoKillSwitch: boolean;
  maxSlippageBps: number;
}

export interface Trader {
  id: string;
  name: string;
  phone: string;
  deviceName: string;
  assignedPhoneSlot: number;
  owner: AccountOwner;
  email?: string;
  emailPassword?: string;
  reddotPayId?: string;
  reddotPayPassword?: string;
  thriversId?: string;
  thriversPassword?: string;
  fundpipsId?: string;
  fundpipsPassword?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'ACCOUNT_FEE'      // Challenge / opening fee for Phase 1 accounts
  | 'PHONE_PACKAGE'    // Monthly SIM / mobile data package
  | 'VPS_INFRA'        // Server hosting, proxy, VPS
  | 'OTHER';           // General / Miscellaneous

export type ExpenseCurrency = 'USDT' | 'PKR' | 'USD';

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  title: string;
  description?: string;
  amount: number;
  currency: ExpenseCurrency;
  exchangeRateToUsd?: number; // 286 PKR = 1 USDT
  paidBy: AccountOwner;
  date: string;               // YYYY-MM-DD
  timeAgo?: string;
  
  // Linkage and tracker fields
  broker?: BrokerName;        // 'Yahoodi' | 'Bengali'
  accountId?: string;         // Linked account if category is ACCOUNT_FEE
  accountName?: string;
  accountPhase?: AccountPhase;
  accountSize?: string;       // e.g. "10k", "100k"
  traderId?: string;          // Linked trader if category is PHONE_PACKAGE
  traderName?: string;
  phoneSlot?: number;
  renewedOn?: string;         // e.g. "26 August 2026"
  nextRenewalDate?: string;   // e.g. "25 September 2026"
  monthPeriod?: string;       // e.g. "August 2026", "September 2026"
  paymentMethod?: string;
  transactionRef?: string;
  notes?: string;
  createdAt: string;
}

