import React, { useState, useEffect } from 'react';
import { Search, Edit, DollarSign, Calendar, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Payments() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Pending'

  // Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/customers');
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customers payment ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setTotalAmount(c.totalAmount || 0);
    setDiscount(c.discount || 0);
    setPaidAmount(c.paidAmount || 0);
    setPaymentStatus(c.paymentStatus || 'Pending');
    setIsModalOpen(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    const balance = totalAmount - discount - paidAmount;
    // Auto status determination unless manually chosen differently
    const payload = {
      totalAmount,
      discount,
      paidAmount,
      paymentStatus
    };
    try {
      await axios.put(`/api/v1/customers/${editingCustomer._id}`, payload);
      toast.success('Payment details updated successfully!');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update payment details.');
    } finally {
      setSaving(false);
    }
  };

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Paid') return matchesSearch && c.paymentStatus === 'Paid';
    if (statusFilter === 'Pending') return matchesSearch && c.paymentStatus === 'Pending';
    
    return matchesSearch;
  });

  // Calculate statistics (based on all customers)
  const totalPaidCount = customers.filter(c => c.paymentStatus === 'Paid').length;
  const totalPendingCount = customers.filter(c => c.paymentStatus === 'Pending').length;
  const totalOutstandingBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Payment Receipts Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track event totals, client payments, custom discounts, and outstanding dues
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
          title="Refresh ledger"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Statistics Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Totally Paid */}
        <div className="p-5 rounded-premium bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Totally Paid</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalPaidCount} Clients</p>
            </div>
          </div>
        </div>

        {/* Card 2: Want to Pay / Pending */}
        <div className="p-5 rounded-premium bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/10 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Want to Pay (Pending)</span>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{totalPendingCount} Clients</p>
            </div>
          </div>
        </div>

        {/* Card 3: Total Outstanding Balance */}
        <div className="p-5 rounded-premium bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/10 shadow-premium flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Outstanding Balance</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{currencySymbol}{totalOutstandingBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Name Search Input */}
        <div className="relative w-full sm:max-w-md flex items-center">
          <Search size={16} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-sm focus:border-primary transition-all"
          />
        </div>

        {/* Status Filters Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner w-full sm:w-auto">
          {['All', 'Paid', 'Pending'].map((opt) => (
            <button
              key={opt}
              onClick={() => setStatusFilter(opt)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                statusFilter === opt
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-550 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {opt === 'All' ? 'All Clients' : opt === 'Paid' ? 'Totally Paid' : 'Want to Pay'}
            </button>
          ))}
        </div>

      </div>

      {/* Ledger Table */}
      <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">Client Name</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Amount Paid</th>
                <th className="py-3.5 px-3">Balance to Pay</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 shimmer-loading rounded-xl">
                    Syncing transaction values...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No customer records matched your query.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const currentBalance = c.balance ?? Math.max(0, (c.totalAmount || 0) - (c.discount || 0) - (c.paidAmount || 0));
                  return (
                    <tr 
                      key={c._id}
                      className="border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3 text-slate-500 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          {c.eventDate || 'N/A'}
                        </span>
                      </td>
                      
                      {/* Name */}
                      <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {c.name}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          c.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {c.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {currencySymbol}{(c.paidAmount || 0).toFixed(2)}
                      </td>

                      {/* Balance to Pay */}
                      <td className="py-3.5 px-3 font-bold whitespace-nowrap">
                        <span className={currentBalance > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
                          {currencySymbol}{currentBalance.toFixed(2)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-all"
                          title="Edit Payment Details"
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Update Payment Details: ${editingCustomer?.name || ''}`}
      >
        <form onSubmit={handleUpdatePayment} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
            <input
              type="text"
              readOnly
              value={editingCustomer?.name || ''}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Total Amount (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={totalAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTotalAmount(val);
                  const bal = val - discount - paidAmount;
                  setPaymentStatus(bal <= 0 ? 'Paid' : 'Pending');
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Discount (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={discount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setDiscount(val);
                  const bal = totalAmount - val - paidAmount;
                  setPaymentStatus(bal <= 0 ? 'Paid' : 'Pending');
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Paid Amount (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={paidAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setPaidAmount(val);
                  const bal = totalAmount - discount - val;
                  setPaymentStatus(bal <= 0 ? 'Paid' : 'Pending');
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs font-bold text-emerald-600 dark:text-emerald-450"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Balance Amount (₹)</label>
              <input
                type="number"
                readOnly
                value={totalAmount - discount - paidAmount}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-extrabold text-rose-500 dark:text-rose-450"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              <option value="Pending">Pending (Want to Pay)</option>
              <option value="Paid">Paid (Totally Paid)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {saving ? 'Updating...' : 'Update Payment Details'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
