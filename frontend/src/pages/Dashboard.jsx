import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, Calendar, DollarSign, CreditCard, 
  ArrowUpRight, ArrowDownRight, Trophy, Sparkles, Plus 
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import axios from 'axios';
import CalendarWidget from '../components/CalendarWidget';
import toast from 'react-hot-toast';
import gsap from 'gsap';

// Custom Count-Up Counter Animation Helper with GSAP
function Counter({ value, prefix = '', suffix = '' }) {
  const elRef = useRef(null);

  useEffect(() => {
    const target = { val: 0 };
    const end = parseFloat(value);
    if (isNaN(end) || end === 0) {
      if (elRef.current) elRef.current.textContent = prefix + (value || 0) + suffix;
      return;
    }

    gsap.to(target, {
      val: end,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => {
        if (elRef.current) {
          elRef.current.textContent = prefix + Math.floor(target.val).toLocaleString() + suffix;
        }
      }
    });
  }, [value, prefix, suffix]);

  return <span ref={elRef}>{prefix}0{suffix}</span>;
}

export default function Dashboard() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, eventRes] = await Promise.all([
          axios.get('/api/v1/dashboard/stats'),
          axios.get('/api/v1/events')
        ]);
        setData(statsRes.data.data);
        setEvents(eventRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err.message);
        toast.error('Could not load analytics metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-[200px] shimmer-loading rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 shimmer-loading rounded-premium" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 shimmer-loading rounded-premium lg:col-span-2" />
          <div className="h-80 shimmer-loading rounded-premium" />
        </div>
      </div>
    );
  }

  const { kpis, charts, recentActivities } = data;

  const COLORS = ['#C59B27', '#7A1C2C'];

  const quickActions = [
    { label: 'Add Customer', path: '/customers?action=add', color: 'bg-primary text-white' },
    { label: 'Create Event', path: '/events?action=add', color: 'bg-secondary text-white' },
    { label: 'Generate Invoice', path: '/invoices?action=add', color: 'bg-emerald-500 text-white' },
    { label: 'Record Payment', path: '/payments?action=add', color: 'bg-amber-500 text-white' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {settings?.businessName || "Maha's Kitchen"} Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Performance analytics overview
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Customers */}
        <motion.div
          whileHover={{ y: -5 }}
          className="p-5 rounded-premium glass-card shadow-premium relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-4">
            <Counter value={kpis.totalCustomers} />
          </p>
          <div className="flex items-center gap-1 text-[10px] text-success mt-2">
            <ArrowUpRight size={12} />
            <span>12% from last month</span>
          </div>
        </motion.div>

        {/* Total Events */}
        <motion.div
          whileHover={{ y: -5 }}
          className="p-5 rounded-premium glass-card shadow-premium relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booked Events</span>
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-4">
            <Counter value={kpis.totalEvents} />
          </p>
          <div className="flex items-center gap-1 text-[10px] text-success mt-2">
            <ArrowUpRight size={12} />
            <span>4 upcoming this week</span>
          </div>
        </motion.div>

        {/* Revenue */}
        <motion.div
          whileHover={{ y: -5 }}
          className="p-5 rounded-premium glass-card shadow-premium relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-4">
            <Counter value={kpis.totalRevenue} prefix={currencySymbol} />
          </p>
          <div className="flex items-center gap-1 text-[10px] text-success mt-2">
            <ArrowUpRight size={12} />
            <span>8% increase</span>
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts & Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-premium flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Monthly Financial Income & Revenue</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Comparative visual overview of monthly revenue vs operational expenses</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7D1525" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#7D1525" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8860B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#B8860B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="revenue" name={`Revenue (${currencySymbol})`} stroke="#7D1525" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                <Area type="monotone" dataKey="expenses" name={`Expenses (${currencySymbol})`} stroke="#B8860B" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Pie Chart */}
        <div className="p-6 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-premium flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Revenue vs Expenses</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Summary of operating efficiency</p>
          </div>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.revenueVsExpense}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="amount"
                >
                  {charts.revenueVsExpense.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#7D1525' : '#B8860B'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#7D1525]" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#B8860B]" />
              <span>Expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Calendar Scheduler & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Widget */}
        <div className="lg:col-span-2">
          <CalendarWidget events={events} />
        </div>

        {/* Quick Actions & Recent Activities */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
            <h3 className="font-bold text-sm mb-4">Quick Add Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((act, i) => (
                <button
                  key={i}
                  onClick={() => window.location.href = act.path}
                  className={`p-3 text-center rounded-xl font-bold text-xs hover:scale-[1.02] shadow-sm hover:shadow-md transition-all duration-150 flex flex-col items-center justify-center gap-1 focus:outline-none ${act.color}`}
                >
                  <Plus size={14} />
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activities Feed */}
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
            <h3 className="font-bold text-sm mb-4">Recent Audit Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-300 leading-tight">
                      {act.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
