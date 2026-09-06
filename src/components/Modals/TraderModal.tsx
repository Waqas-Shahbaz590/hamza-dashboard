import React, { useState, useEffect } from 'react';
import { Trader, AccountOwner } from '../../types';

interface TraderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrader: (trader: Trader) => void;
  editingTrader?: Trader | null;
  existingPhoneSlots: number[];
}

export const TraderModal: React.FC<TraderModalProps> = ({
  isOpen,
  onClose,
  onSaveTrader,
  editingTrader,
  existingPhoneSlots,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [assignedPhoneSlot, setAssignedPhoneSlot] = useState<number>(1);
  const [owner, setOwner] = useState<AccountOwner>('Ismail');
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [reddotPayId, setReddotPayId] = useState('');
  const [reddotPayPassword, setReddotPayPassword] = useState('');
  const [thriversId, setThriversId] = useState('');
  const [thriversPassword, setThriversPassword] = useState('');
  const [fundpipsId, setFundpipsId] = useState('');
  const [fundpipsPassword, setFundpipsPassword] = useState('');
  const [notes, setNotes] = useState('');

  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showRdpPass, setShowRdpPass] = useState(false);
  const [showThrPass, setShowThrPass] = useState(false);
  const [showFndPass, setShowFndPass] = useState(false);

  useEffect(() => {
    if (editingTrader) {
      setName(editingTrader.name);
      setPhone(editingTrader.phone);
      setDeviceName(editingTrader.deviceName);
      setAssignedPhoneSlot(editingTrader.assignedPhoneSlot);
      setOwner(editingTrader.owner);
      setEmail(editingTrader.email || '');
      setEmailPassword(editingTrader.emailPassword || '');
      setReddotPayId(editingTrader.reddotPayId || '');
      setReddotPayPassword(editingTrader.reddotPayPassword || '');
      setThriversId(editingTrader.thriversId || editingTrader.yahoodiId || '');
      setThriversPassword(editingTrader.thriversPassword || editingTrader.yahoodiPassword || '');
      setFundpipsId(editingTrader.fundpipsId || editingTrader.bengaliId || '');
      setFundpipsPassword(editingTrader.fundpipsPassword || editingTrader.bengaliPassword || '');
      setNotes(editingTrader.notes || '');
    } else {
      // Find next free slot
      let nextSlot = 1;
      while (existingPhoneSlots.includes(nextSlot)) {
        nextSlot++;
      }
      setName('');
      setPhone('');
      setDeviceName('');
      setAssignedPhoneSlot(nextSlot);
      setOwner('Ismail');
      setEmail('');
      setEmailPassword('');
      setReddotPayId('');
      setReddotPayPassword('');
      setThriversId('');
      setThriversPassword('');
      setFundpipsId('');
      setFundpipsPassword('');
      setNotes('');
    }
  }, [editingTrader, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedTrader: Trader = {
      id: editingTrader ? editingTrader.id : `trader-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      deviceName: deviceName.trim() || 'Mobile Device',
      assignedPhoneSlot: Number(assignedPhoneSlot) || 1,
      owner,
      email: email.trim() || undefined,
      emailPassword: emailPassword.trim() || undefined,
      reddotPayId: reddotPayId.trim() || undefined,
      reddotPayPassword: reddotPayPassword.trim() || undefined,
      thriversId: thriversId.trim() || undefined,
      thriversPassword: thriversPassword.trim() || undefined,
      fundpipsId: fundpipsId.trim() || undefined,
      fundpipsPassword: fundpipsPassword.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingTrader ? editingTrader.createdAt : 'Today',
    };

    onSaveTrader(formattedTrader);
    onClose();
  };

  return (
    <div
      id="trader-modal-backdrop"
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        id="trader-modal-dialog"
        className="bg-white border border-[#DEE2E6] rounded max-w-xl w-full p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DEE2E6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <span className="material-symbols-outlined text-[20px]">
                {editingTrader ? 'edit_square' : 'person_add'}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {editingTrader ? 'Edit Trader Profile & Credentials' : 'Register New Trader Profile'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure trader credentials, device hardware, and dashboard slot assignment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Trader Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Device & Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded border border-slate-200/80">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Device Hardware Name <span className="text-slate-400 font-normal">(Raw Hardware)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. iPhone 15 Pro, Samsung S24 Ultra"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Dashboard Slot <span className="text-indigo-600 font-normal">(Phone #)</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-bold">Phone</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={assignedPhoneSlot}
                  onChange={(e) => setAssignedPhoneSlot(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded font-mono font-bold text-center focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Owner Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Assigned Account Owner
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOwner('Ismail')}
                className={`py-2 px-3 rounded text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  owner === 'Ismail'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Ismail</span>
              </button>
              <button
                type="button"
                onClick={() => setOwner('Hamza')}
                className={`py-2 px-3 rounded text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  owner === 'Hamza'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Hamza</span>
              </button>
            </div>
          </div>

          {/* Credentials Vault Section */}
          <div className="pt-2 border-t border-[#DEE2E6]">
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-600">lock</span>
              <span>Credentials Vault (Auto-fills on Account Connect)</span>
            </h3>

            <div className="space-y-3">
              {/* Email & Password */}
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  Trader Email & Password
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="trader.email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type={showEmailPass ? 'text' : 'password'}
                      placeholder="Email Password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white border border-slate-200 rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPass(!showEmailPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showEmailPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Reddot Pay */}
              <div className="p-2.5 bg-amber-50/50 rounded border border-amber-200/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Reddot Pay Account
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Reddot Pay ID / Username"
                    value={reddotPayId}
                    onChange={(e) => setReddotPayId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type={showRdpPass ? 'text' : 'password'}
                      placeholder="Reddot Pay Password"
                      value={reddotPayPassword}
                      onChange={(e) => setReddotPayPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white border border-amber-200 rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRdpPass(!showRdpPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showRdpPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Thrivers Credentials */}
              <div className="p-2.5 bg-blue-50/50 rounded border border-blue-200/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Thrivers Broker Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Thrivers Account / ID"
                    value={thriversId}
                    onChange={(e) => setThriversId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type={showThrPass ? 'text' : 'password'}
                      placeholder="Thrivers Password"
                      value={thriversPassword}
                      onChange={(e) => setThriversPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white border border-blue-200 rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowThrPass(!showThrPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showThrPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fundpips Credentials */}
              <div className="p-2.5 bg-emerald-50/50 rounded border border-emerald-200/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Fundpips Broker Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Fundpips Account / ID"
                    value={fundpipsId}
                    onChange={(e) => setFundpipsId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded focus:outline-none"
                  />
                  <div className="relative">
                    <input
                      type={showFndPass ? 'text' : 'password'}
                      placeholder="Fundpips Password"
                      value={fundpipsPassword}
                      onChange={(e) => setFundpipsPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 pr-8 text-xs bg-white border border-emerald-200 rounded focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFndPass(!showFndPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showFndPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Trading Notes & Directives
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Night session specialist, EUR pairs only..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DEE2E6]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              {editingTrader ? 'Save Changes' : 'Register Trader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
