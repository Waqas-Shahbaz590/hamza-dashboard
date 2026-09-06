import React, { useState } from 'react';
import { ServerHostingConfig } from '../types';
import { DEFAULT_HOST_CONFIG } from '../data/mockData';

interface SettingsViewProps {
  onSaveToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaveToast }) => {
  const [config, setConfig] = useState<ServerHostingConfig>(DEFAULT_HOST_CONFIG);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleTestPing = () => {
    setIsTestingPing(true);
    setPingResult(null);
    setTimeout(() => {
      setIsTestingPing(false);
      setPingResult('Success: 11.8ms RTT (us-east1 Cloud Node)');
    }, 800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSaveToast('Sync & Web Hosting settings successfully updated and deployed.');
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F1F3F5] text-[#1A1C1E] space-y-4 md:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
          Settings &amp; Web Hosting Gateway
        </h1>
        <p className="text-xs text-slate-500">
          Configure online server nodes, multi-broker API webhooks, sync intervals, and risk kill-switches.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Online Web Hosting & Server Node */}
        <div className="bg-white border border-[#DEE2E6] rounded p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#DEE2E6] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-blue-600">dns</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Online Web Hosting Node &amp; Edge Sync
              </h2>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
              SSL / TLS 1.3 SECURED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Server Name / Host Identifier
              </label>
              <input
                type="text"
                value={config.serverName}
                onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Hosting Region &amp; Cloud Infrastructure
              </label>
              <input
                type="text"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Public Gateway IP &amp; Port
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.hostIp}
                  onChange={(e) => setConfig({ ...config, hostIp: e.target.value })}
                  className="flex-1 bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 3000 })}
                  className="w-20 bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Broker Webhook Ingestion Endpoint
              </label>
              <input
                type="text"
                value={config.webhookEndpoint}
                onChange={(e) => setConfig({ ...config, webhookEndpoint: e.target.value })}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Diagnostics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-slate-50 p-2.5 rounded border border-[#DEE2E6]">
            <div className="flex items-center gap-3.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Uptime: <strong className="text-slate-900 font-mono">{config.uptime}</strong></span>
              </span>
              <span>Active Sockets: <strong className="text-slate-900 font-mono">{config.activeSockets}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {pingResult && (
                <span className="text-[11px] text-emerald-600 font-medium font-mono">
                  {pingResult}
                </span>
              )}
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTestingPing}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#DEE2E6] text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTestingPing ? 'Testing Node...' : 'Ping Hosting Server'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Sync Frequency & Real-Time Engine */}
        <div className="bg-white border border-[#DEE2E6] rounded p-4 space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#DEE2E6] pb-2">
            <span className="material-symbols-outlined text-[16px] text-blue-600">sync_saved_locally</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Multi-Broker Polling &amp; Websocket Sync
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sync Frequency (Interval in seconds)
              </label>
              <select
                value={config.syncIntervalSec}
                onChange={(e) => setConfig({ ...config, syncIntervalSec: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={1}>1 Second (Ultra Low-Latency DMA Streaming)</option>
                <option value={5}>5 Seconds (High Frequency)</option>
                <option value={15}>15 Seconds (Standard Pro)</option>
                <option value={60}>60 Seconds (Conservative Bandwidth)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Max Allowed Order Slippage (Basis Points)
              </label>
              <input
                type="number"
                value={config.maxSlippageBps}
                onChange={(e) => setConfig({ ...config, maxSlippageBps: parseInt(e.target.value) || 15 })}
                className="w-full bg-slate-50 border border-[#DEE2E6] rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Risk Controls & Auto-Kill Switch */}
        <div className="bg-white border border-[#DEE2E6] rounded p-4 space-y-3.5">
          <div className="flex items-center gap-2 border-b border-[#DEE2E6] pb-2">
            <span className="material-symbols-outlined text-[16px] text-rose-600">gavel</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Risk Safeguards &amp; Emergency Auto-Kill Switch
            </h2>
          </div>

          <div className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded border border-[#DEE2E6]">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                Global Drawdown Circuit Breaker
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically disconnects broker order routing and cancels working open orders if total group equity decreases by more than 5% within any 24h cycle.
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.autoKillSwitch}
              onChange={(e) => setConfig({ ...config, autoKillSwitch: e.target.checked })}
              className="w-4 h-4 rounded border-[#DEE2E6] text-blue-600 focus:ring-0 cursor-pointer mt-1"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{isSaving ? 'Deploying Changes...' : 'Save & Deploy Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
