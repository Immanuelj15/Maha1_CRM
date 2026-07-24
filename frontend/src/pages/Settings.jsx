import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { Settings as SettingsIcon, Shield, User, Store, Moon, Sun, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile } = useAuthStore();
  const { settings, fetchSettings, updateSettings, theme, toggleTheme } = useSettingsStore();

  // Profile Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Business Form states
  const [businessName, setBusinessName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setBizEmail(settings.email || '');
      setBizPhone(settings.phone || '');
      setBizAddress(settings.address || '');
      setGstNumber(settings.gstNumber || '');
      setInvoiceNotes(settings.invoiceNotes || '');
      setTermsConditions(settings.termsConditions || '');
      setCurrencySymbol(settings.currencySymbol || '₹');
    }
  }, [settings]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const success = await updateProfile({ username, email, password });
    if (success) {
      setPassword('');
      toast.success('Admin profile credentials saved!');
    } else {
      toast.error('Failed to update credentials.');
    }
  };

  const handleUpdateBusiness = async (e) => {
    e.preventDefault();
    const payload = {
      businessName,
      email: bizEmail,
      phone: bizPhone,
      address: bizAddress,
      gstNumber,
      invoiceNotes,
      termsConditions,
      currencySymbol
    };
    const success = await updateSettings(payload);
    if (success) {
      toast.success('Branding and billing settings saved!');
    } else {
      toast.error('Failed to update branding settings.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          CRM Configuration Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Adjust visual themes, business details, and PDF invoice templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Business config */}
          <div className="p-6 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Store size={16} className="text-primary" />
              <span>Branding & General Profile</span>
            </h3>

            <form onSubmit={handleUpdateBusiness} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Catering Brand Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">GST / Tax Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="GST-US-99182"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Public Email address</label>
                  <input
                    type="email"
                    value={bizEmail}
                    onChange={(e) => setBizEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Currency symbol</label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Public telephone</label>
                  <input
                    type="text"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Business Physical Address</label>
                <textarea
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  rows="2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice Terms & Conditions</label>
                <textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  rows="2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium focus:outline-none transition-colors"
              >
                Save Business Profile
              </button>
            </form>
          </div>

          {/* Section 2: Account login updates */}
          <div className="p-6 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Shield size={16} className="text-secondary" />
              <span>Security Credentials</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Admin Name</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium focus:outline-none transition-colors"
              >
                Save Credentials
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Theme toggles and info */}
        <div className="p-6 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-6">
          <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <SettingsIcon size={16} className="text-secondary" />
            <span>UI Settings & Status</span>
          </h3>

          {/* Theme panel */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Interface Color Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (theme === 'dark') toggleTheme(); }}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 focus:outline-none transition-all duration-200 ${
                  theme === 'light'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500'
                }`}
              >
                <Sun size={14} />
                Light mode
              </button>
              <button
                onClick={() => { if (theme === 'light') toggleTheme(); }}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 focus:outline-none transition-all duration-200 ${
                  theme === 'dark'
                    ? 'border-secondary bg-secondary/5 text-secondary'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                }`}
              >
                <Moon size={14} />
                Dark mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
