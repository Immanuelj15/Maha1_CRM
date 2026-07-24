import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, DollarSign } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const CATEGORIES = ['Grocery', 'Vegetable', 'Labour', 'Transportation', 'Fuel', 'Maintenance', 'Miscellaneous'];
const COLORS = ['#C59B27', '#7A1C2C', '#E5B842', '#B8860B', '#601421', '#DAA520', '#5F1321'];

export default function Expenses() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState('Grocery');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Paid');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [eventName, setEventName] = useState('');

  const fetchExpensesAndEvents = async () => {
    setLoading(true);
    try {
      const [expRes, eventRes] = await Promise.all([
        axios.get('/api/v1/expenses'),
        axios.get('/api/v1/events')
      ]);
      let data = expRes.data.data || [];
      if (categoryFilter) {
        data = data.filter(e => e.category === categoryFilter);
      }
      setExpenses(data);
      setEvents(eventRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load operational ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndEvents();
  }, [categoryFilter]);

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setAmount(0);
    setCategory('Grocery');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('Paid');
    setDescription('');
    setEventId('');
    setEventName('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setAmount(exp.amount);
    setCategory(exp.category);
    setDate(exp.date);
    setStatus(exp.status || 'Paid');
    setDescription(exp.description || '');
    setEventId(exp.eventId || '');
    setEventName(exp.eventName || '');
    setIsModalOpen(true);
  };

  const handleEventChange = (e) => {
    const id = e.target.value;
    setEventId(id);
    if (!id) {
      setEventName('');
    } else {
      const selected = events.find(ev => ev._id.toString() === id.toString());
      setEventName(selected ? selected.name : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { amount, category, date, status, description, eventId, eventName };
    try {
      if (editingExpense) {
        await axios.put(`/api/v1/expenses/${editingExpense._id}`, payload);
        toast.success('Expense record updated!');
      } else {
        await axios.post('/api/v1/expenses', payload);
        toast.success('Expense recorded successfully!');
      }
      setIsModalOpen(false);
      fetchExpensesAndEvents();
    } catch (err) {
      toast.error('Failed to record expense.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await axios.delete(`/api/v1/expenses/${id}`);
      toast.success('Expense entry purged.');
      fetchExpensesAndEvents();
    } catch (err) {
      toast.error('Could not delete expense.');
    }
  };

  // Compile category costs for the chart
  const getCategoryChartData = () => {
    const sums = {};
    expenses.forEach(exp => {
      sums[exp.category] = (sums[exp.category] || 0) + exp.amount;
    });
    return Object.keys(sums).map(key => ({
      name: key,
      value: sums[key]
    }));
  };

  const chartData = getCategoryChartData();
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Operational Expenses Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log transportation, ingredients buying, utility bills, and wages payouts
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 focus:outline-none transition-all duration-200"
        >
          <Plus size={16} />
          Log Expense
        </button>
      </div>

      {/* Grid: Charts + Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Table Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 shadow-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Description</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Amount</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 shimmer-loading rounded-xl">
                        Reading expense ledger database...
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No expenses logged.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr 
                        key={exp._id}
                        className="border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{exp.category}</div>
                          {exp.eventName && (
                            <div className="text-[9px] text-primary dark:text-indigo-400 font-extrabold mt-0.5 uppercase tracking-wide bg-primary/15 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md inline-block">
                              Event: {exp.eventName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-500">{exp.date}</td>
                        <td className="py-3 px-2 text-slate-500 max-w-[150px] truncate">{exp.description || 'N/A'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            exp.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>{exp.status || 'Paid'}</span>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-danger">-{currencySymbol}{exp.amount.toFixed(2)}</td>
                        <td className="py-3 px-2 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-all duration-150"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="p-1.5 hover:bg-danger/10 rounded-lg text-slate-500 hover:text-danger transition-all duration-150"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Pie Chart Allocations */}
        <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm">Expenses Allocation</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Operational cost breakout</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cumulative Spend:</span>
            <span className="text-lg font-bold text-danger">{currencySymbol}{grandTotal.toFixed(2)}</span>
          </div>

          <div className="h-56 flex items-center justify-center">
            {chartData.length === 0 ? (
              <div className="text-xs text-slate-400">No expenses recorded for allocation metrics.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name} ({currencySymbol}{item.value.toFixed(0)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Creation / Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Log Expense Details'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Associate with Event</label>
            <select
              value={eventId}
              onChange={handleEventChange}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
            >
              <option value="">-- No Associated Event --</option>
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>
                  {ev.name} ({ev.customerName} - {ev.date})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Expense Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="250.00"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs font-bold text-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Expense Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Billing Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="Paid">Paid (Cash/UPI settled)</option>
                <option value="Pending">Pending Payout</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Memo</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Items description, taxi fuel, local helpers, etc."
              rows="3"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingExpense ? 'Modify Log' : 'Post Expense'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
