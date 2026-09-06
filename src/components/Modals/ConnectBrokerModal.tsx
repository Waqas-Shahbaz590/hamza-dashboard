import React, { useState, useEffect } from 'react';
import { Account, BrokerName, AccountPhase, AccountOwner, Trader, ExpenseItem } from '../../types';
import { BROKER_LOGOS } from '../../data/mockData';

interface ConnectBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (newAccount: Account) => void;
  onAddExpense?: (expense: ExpenseItem) => void;
  traders?: Trader[];
  initialSelectedTraderId?: string;
  onOpenCreateTrader?: () => void;
}

export const ConnectBrokerModal: React.FC<ConnectBrokerModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  onAddExpense,
  traders = [],
  initialSelectedTraderId,
  onOpenCreateTrader,
}) => {
  const [selectedTraderId, setSelectedTraderId] = useState<string>('');
  const [broker, setBroker] = useState<BrokerName>('Thrivers');
  const [personName, setPersonName] = useState('');
  const [owner, setOwner] = useState<AccountOwner>('Ismail');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountBalance, setAccountBalance] = useState('10000');
  const [phase, setPhase] = useState<AccountPhase>('Phase 1');
  const [phone, setPhone] = useState<number>(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Finance Challenge Fee State (applies only to Phase 1)
  const [recordChallengeFee, setRecordChallengeFee] = useState(true);
  const [challengeFeeAmount, setChallengeFeeAmount] = useState('150');
  const [challengeFeeCurrency, setChallengeFeeCurrency] = useState<'USDT' | 'USD'>('USDT');
  const [feePaidBy, setFeePaidBy] = useState<AccountOwner>('Ismail');
  const [feePaymentMethod, setFeePaymentMethod] = useState('Binance USDT (TRC-20)');

  // Initialize or update when trader selection changes
  useEffect(() => {
    if (initialSelectedTraderId) {
      setSelectedTraderId(initialSelectedTraderId);
      const targetTrader = traders.find((t) => t.id === initialSelectedTraderId);
      if (targetTrader) {
        applyTraderData(targetTrader, broker);
      }
    } else if (traders.length > 0 && !personName) {
      // Default to first trader if empty
      setSelectedTraderId(traders[0].id);
      applyTraderData(traders[0], broker);
    }
  }, [initialSelectedTraderId, isOpen]);

  const applyTraderData = (t: Trader, chosenBroker: BrokerName) => {
    setPersonName(t.name);
    setOwner(t.owner);
    setFeePaidBy(t.owner);
    setPhone(t.assignedPhoneSlot);
    if (chosenBroker === 'Thrivers') {
      setAccountNumber(t.thriversId || '');
    } else if (chosenBroker === 'Fundpips') {
      setAccountNumber(t.fundpipsId || '');
    }
  };

  const handleSelectTrader = (traderId: string) => {
    setSelectedTraderId(traderId);
    if (!traderId) return;
    const target = traders.find((t) => t.id === traderId);
    if (target) {
      applyTraderData(target, broker);
    }
  };

  const handleBrokerChange = (newBroker: BrokerName) => {
    setBroker(newBroker);
    if (selectedTraderId) {
      const target = traders.find((t) => t.id === selectedTraderId);
      if (target) {
        if (newBroker === 'Thrivers') {
          setAccountNumber(target.thriversId || '');
        } else if (newBroker === 'Fundpips') {
          setAccountNumber(target.fundpipsId || '');
        }
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Initiating handshake with broker API gateway...');

    setTimeout(() => {
      setConnectionStatus('Verifying 2FA tokens & permissions...');
      setTimeout(() => {
        setConnectionStatus('Syncing historical orders & equity positions...');
        setTimeout(() => {
          const balanceNum = parseFloat(accountBalance) || 10000;
          const traderName = personName.trim();
          const newAccId = `acc-${Date.now()}`;
          const newAcc: Account = {
            id: newAccId,
            accountName: traderName,
            broker,
            brokerLogo: BROKER_LOGOS[broker],
            personName: traderName,
            owner,
            phone,
            device: 'mobile',
            accountNumber: accountNumber.trim() || `U${Math.floor(1000000 + Math.random() * 9000000)}`,
            accountBalance: balanceNum,
            equity: balanceNum * (phase === 'Live' ? 1.25 : 1.0),
            dayPnL: 0,
            dayPnLPercent: 0,
            phase,
            status: 'ONLINE',
            lastSync: 'Just now',
            serverNode: 'US-East (Cloud Run Gateway)',
            openPositionsCount: 0,
            leverage: '4:1 Portfolio',
          };

          // If Phase 1 and fee recording is enabled, record the challenge fee expense
          if (phase === 'Phase 1' && recordChallengeFee && onAddExpense) {
            const feeVal = parseFloat(challengeFeeAmount);
            if (feeVal > 0) {
              const sizeNum = balanceNum;
              const sizeLabel = sizeNum >= 1000 ? `${(sizeNum / 1000).toFixed(0)}k` : `${sizeNum}`;
              const newExpense: ExpenseItem = {
                id: `exp-${Date.now()}`,
                category: 'ACCOUNT_FEE',
                title: `${broker} Phase 1 ${sizeLabel} account`,
                description: `Initial challenge evaluation fee for ${traderName} on ${broker}`,
                amount: feeVal,
                currency: challengeFeeCurrency,
                exchangeRateToUsd: 1,
                paidBy: feePaidBy,
                broker: broker,
                date: new Date().toISOString().split('T')[0],
                timeAgo: 'Just now',
                accountId: newAccId,
                accountName: traderName,
                accountPhase: 'Phase 1',
                accountSize: sizeLabel,
                paymentMethod: feePaymentMethod,
                notes: `Recorded on account connection (${broker})`,
                createdAt: new Date().toISOString(),
              };
              onAddExpense(newExpense);
            }
          }

          setIsConnecting(false);
          setConnectionStatus(null);
          onAddAccount(newAcc);
          onClose();
        }, 600);
      }, 600);
    }, 600);
  };

  return (
    <div
      id="connect-broker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="connect-broker-modal-content"
        className="bg-white border border-[#DEE2E6] rounded-xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 text-[#1A1C1E] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#DEE2E6] flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[16px]">add_link</span>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Connect Broker Account
              </h3>
              <p className="text-[10px] text-slate-500">
                Link trader profile with broker API gateway for automated DMA execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Trader Profile Quick Selector */}
          {traders.length > 0 && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-indigo-600">badge</span>
                  <span>Select Registered Trader (Auto-fills Details)</span>
                </label>
                {onOpenCreateTrader && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateTrader();
                    }}
                    className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    <span>New Trader Profile</span>
                  </button>
                )}
              </div>
              <select
                value={selectedTraderId}
                onChange={(e) => handleSelectTrader(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Or enter custom trader details manually --</option>
                {traders.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Phone {t.assignedPhoneSlot} • {t.deviceName} • {t.owner})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Broker Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Select Broker Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleBrokerChange('Thrivers')}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer text-left ${
                  broker === 'Thrivers'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-[#DEE2E6] bg-white hover:bg-slate-50'
                }`}
              >
                <img
                  src={BROKER_LOGOS['Thrivers']}
                  alt="Thrivers Logo"
                  className="w-6 h-6 rounded object-contain border border-[#DEE2E6] bg-white p-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Thrivers</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleBrokerChange('Fundpips')}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer text-left ${
                  broker === 'Fundpips'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-[#DEE2E6] bg-white hover:bg-slate-50'
                }`}
              >
                <img
                  src={BROKER_LOGOS['Fundpips']}
                  alt="Fundpips Logo"
                  className="w-6 h-6 rounded object-contain border border-[#DEE2E6] bg-white p-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Fundpips</div>
                </div>
              </button>
            </div>
          </div>

          {/* Trader Name & Account Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Trader Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Broker Account / ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. THR-77182"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Account Balance & Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Account Balance ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="10000.00"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Trading Phase
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as AccountPhase)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="Phase 1">Phase 1 (Challenge)</option>
                <option value="Phase 2">Phase 2 (Evaluation)</option>
                <option value="Live">Live (Funded)</option>
                <option value="Breached">Breached (Inactive)</option>
              </select>
            </div>
          </div>

          {/* PHASE 1 CHALLENGE FEE TRACKING */}
          {phase === 'Phase 1' ? (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordChallengeFee}
                    onChange={(e) => setRecordChallengeFee(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Record Account Opening / Challenge Fee in Finances</span>
                </label>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  USDT Deposit
                </span>
              </div>

              {recordChallengeFee && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-amber-200/60">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                      Challenge Fee ({challengeFeeCurrency})
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={challengeFeeAmount}
                        onChange={(e) => setChallengeFeeAmount(e.target.value)}
                        placeholder="150"
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <select
                        value={challengeFeeCurrency}
                        onChange={(e) => setChallengeFeeCurrency(e.target.value as 'USDT' | 'USD')}
                        className="px-1.5 py-1 bg-white border border-amber-300 rounded text-[11px] font-bold text-amber-900"
                      >
                        <option value="USDT">USDT</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                      Fee Paid By (Owner)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFeePaidBy('Ismail')}
                        className={`flex-1 py-1 px-1.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          feePaidBy === 'Ismail'
                            ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                            : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100/50'
                        }`}
                      >
                        Ismail
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeePaidBy('Hamza')}
                        className={`flex-1 py-1 px-1.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          feePaidBy === 'Hamza'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100/50'
                        }`}
                      >
                        Hamza
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-slate-400">info</span>
              <span>No challenge or deposit fee is recorded for {phase} accounts.</span>
            </div>
          )}

          {/* Device Phone Slot & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Dashboard Slot (Phone #)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">Phone</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={phone}
                  onChange={(e) => setPhone(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-center focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Account Owner
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOwner('Ismail')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    owner === 'Ismail'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Ismail
                </button>
                <button
                  type="button"
                  onClick={() => setOwner('Hamza')}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    owner === 'Hamza'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Hamza
                </button>
              </div>
            </div>
          </div>

          {/* Status message during connecting */}
          {connectionStatus && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded flex items-center gap-2 text-blue-700 text-xs animate-pulse">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{connectionStatus}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DEE2E6]">
            <button
              type="button"
              onClick={onClose}
              disabled={isConnecting}
              className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="px-4 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                  <span>Linking...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  <span>Connect Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
