import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash, Users, CheckSquare, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Labour() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [workers, setWorkers] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [stats, setStats] = useState({ totalWorkers: 0, todayAttendance: 0, pendingLabourPayments: 0, paidLabourPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('roster');

  // Event labour workforce state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assignedWorkers, setAssignedWorkers] = useState([]);
  const [selectedWorkerIdToAdd, setSelectedWorkerIdToAdd] = useState('');
  const [eventLabourRecords, setEventLabourRecords] = useState([]);
  const [filterEventName, setFilterEventName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loadingEventLabour, setLoadingEventLabour] = useState(false);

  // Workers register modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('Server');
  const [phone, setPhone] = useState('');
  const [dailyWage, setDailyWage] = useState(0);

  const fetchWorkersAndStats = async () => {
    setLoading(true);
    try {
      const [workersRes, statsRes] = await Promise.all([
        axios.get('/api/v1/labour'),
        axios.get('/api/v1/labour-stats')
      ]);
      setWorkers(workersRes.data.data || []);
      setStats(statsRes.data.data || { totalWorkers: 0, todayAttendance: 0, pendingLabourPayments: 0, paidLabourPayments: 0 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load workers database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (date) => {
    setAttendanceLoading(true);
    try {
      const res = await axios.get(`/api/v1/attendance?date=${date}`);
      setAttendanceRecord(res.data.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance list.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchEventLabourRecords = async () => {
    try {
      const res = await axios.get('/api/v1/event-labour');
      setEventLabourRecords(res.data.data || []);
    } catch (err) {
      console.error('Failed to load event labour database:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/v1/events');
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Failed to load events list:', err);
    }
  };

  useEffect(() => {
    fetchWorkersAndStats();
    fetchEvents();
    fetchEventLabourRecords();
  }, []);

  useEffect(() => {
    fetchAttendance(attendanceDate);
  }, [attendanceDate]);

  useEffect(() => {
    if (!selectedEventId) {
      setAssignedWorkers([]);
      return;
    }
    const loadSavedAllocation = async () => {
      setLoadingEventLabour(true);
      try {
        const res = await axios.get(`/api/v1/event-labour?eventId=${selectedEventId}`);
        const found = res.data.data;
        if (found && found.length > 0) {
          setAssignedWorkers(found[0].workers || []);
        } else {
          setAssignedWorkers([]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load saved event labour details.');
      } finally {
        setLoadingEventLabour(false);
      }
    };
    loadSavedAllocation();
  }, [selectedEventId]);

  const handleOpenCreateModal = () => {
    setEditingWorker(null);
    setName('');
    setRole('Server');
    setPhone('');
    setDailyWage(80);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (w) => {
    setEditingWorker(w);
    setName(w.name);
    setRole(w.role);
    setPhone(w.phone);
    setDailyWage(w.dailyWage);
    setIsModalOpen(true);
  };

  const handleSubmitWorker = async (e) => {
    e.preventDefault();
    const payload = { name, role, phone, dailyWage };
    try {
      if (editingWorker) {
        await axios.put(`/api/v1/labour/${editingWorker._id}`, payload);
        toast.success('Worker details updated!');
      } else {
        await axios.post('/api/v1/labour', payload);
        toast.success('Worker registered successfully!');
      }
      setIsModalOpen(false);
      fetchWorkersAndStats();
    } catch (err) {
      toast.error('Failed to save worker profile.');
    }
  };

  const handleDeleteWorker = async (id) => {
    if (!window.confirm('Remove this worker permanently?')) return;
    try {
      await axios.delete(`/api/v1/labour/${id}`);
      toast.success('Worker removed.');
      fetchWorkersAndStats();
    } catch (err) {
      toast.error('Failed to delete worker.');
    }
  };

  // Helper to build attendance rows
  const getAttendanceRows = () => {
    return workers.map(w => {
      // Find if we have a saved record for this worker on selected date
      const saved = attendanceRecord?.records?.find(r => r.workerId === w._id);
      const defaultStatus = saved ? saved.status : 'Absent';
      return {
        workerId: w._id,
        workerName: w.name,
        role: w.role,
        standardWage: w.dailyWage,
        status: defaultStatus,
        wagePaid: saved ? saved.wagePaid : (defaultStatus === 'Present' ? w.dailyWage : 0),
        paymentStatus: saved ? saved.paymentStatus : (defaultStatus === 'Present' ? 'Pending' : 'Paid')
      };
    });
  };

  const [activeAttendanceList, setActiveAttendanceList] = useState([]);

  useEffect(() => {
    if (workers.length > 0) {
      setActiveAttendanceList(getAttendanceRows());
    }
  }, [workers, attendanceRecord]);

  const handleStatusChange = (workerId, newStatus) => {
    setActiveAttendanceList(prev => prev.map(item => {
      if (item.workerId === workerId) {
        return {
          ...item,
          status: newStatus,
          // Clear wage if absent, or fill with default standard wage
          wagePaid: newStatus === 'Present' ? item.standardWage : 0,
          paymentStatus: newStatus === 'Present' ? 'Pending' : 'Paid'
        };
      }
      return item;
    }));
  };

  const handleAttendanceChange = (workerId, field, value) => {
    setActiveAttendanceList(prev => prev.map(item => 
      item.workerId === workerId ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      const payload = {
        date: attendanceDate,
        records: activeAttendanceList.map(r => ({
          workerId: r.workerId,
          workerName: r.workerName,
          status: r.status,
          wagePaid: parseFloat(r.wagePaid) || 0,
          paymentStatus: r.paymentStatus
        }))
      };

      await axios.post('/api/v1/attendance', payload);
      toast.success(`Attendance records saved for date ${attendanceDate}!`);
      fetchWorkersAndStats(); // update outstanding stats
    } catch (err) {
      toast.error('Failed to save attendance.');
    }
  };

  const handleAddWorkerToEvent = () => {
    if (!selectedWorkerIdToAdd) {
      toast.error('Please select a worker first.');
      return;
    }
    const worker = workers.find(w => w._id.toString() === selectedWorkerIdToAdd.toString());
    if (!worker) return;
    if (assignedWorkers.some(aw => aw.workerId?.toString() === worker._id.toString())) {
      toast.error('Worker is already assigned to this event.');
      return;
    }
    const newWorker = {
      workerId: worker._id.toString(),
      name: worker.name,
      phone: worker.phone || '',
      dailyWage: worker.dailyWage || 0,
      daysWorked: 1,
      totalSalary: worker.dailyWage || 0,
      paidAmount: 0,
      balance: worker.dailyWage || 0,
      status: 'Pending'
    };
    setAssignedWorkers([...assignedWorkers, newWorker]);
    setSelectedWorkerIdToAdd('');
  };

  const handleRemoveWorkerFromEvent = (workerId) => {
    setAssignedWorkers(assignedWorkers.filter(w => w.workerId?.toString() !== workerId?.toString()));
  };

  const handleEventWorkerChange = (workerId, field, value) => {
    setAssignedWorkers(prev => prev.map(w => {
      if (w.workerId?.toString() === workerId?.toString()) {
        const updated = { ...w, [field]: value };
        
        // Auto compute totalSalary
        if (field === 'dailyWage' || field === 'daysWorked') {
          const wage = parseFloat(field === 'dailyWage' ? value : w.dailyWage) || 0;
          const days = parseFloat(field === 'daysWorked' ? value : w.daysWorked) || 0;
          updated.totalSalary = wage * days;
        }

        // Auto compute balance and status
        const total = updated.totalSalary;
        const paid = parseFloat(field === 'paidAmount' ? value : w.paidAmount) || 0;
        updated.balance = total - paid;
        updated.status = updated.balance <= 0 ? 'Paid' : 'Pending';

        return updated;
      }
      return w;
    }));
  };

  const handleSaveEventLabour = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event first.');
      return;
    }
    const selectedEvent = events.find(ev => ev._id === selectedEventId);
    if (!selectedEvent) return;

    try {
      const payload = {
        eventId: selectedEvent._id,
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        customerName: selectedEvent.customerName || '',
        address: selectedEvent.location || '',
        workers: assignedWorkers.map(w => ({
          workerId: w.workerId,
          name: w.name,
          phone: w.phone,
          dailyWage: parseFloat(w.dailyWage) || 0,
          daysWorked: parseFloat(w.daysWorked) || 0,
          totalSalary: parseFloat(w.totalSalary) || 0,
          paidAmount: parseFloat(w.paidAmount) || 0,
          balance: parseFloat(w.balance) || 0,
          status: w.status
        }))
      };

      await axios.post('/api/v1/event-labour', payload);
      toast.success('Event labour allocations saved successfully!');
      fetchEventLabourRecords(); // refresh history list
    } catch (err) {
      console.error(err);
      toast.error('Failed to save event labour record.');
    }
  };

  const handleDeleteEventLabour = async (id) => {
    if (!window.confirm('Delete this event labour allocation?')) return;
    try {
      await axios.delete(`/api/v1/event-labour/${id}`);
      toast.success('Event labour record deleted.');
      fetchEventLabourRecords();
      if (selectedEventId) {
        // Reset editor if we deleted the currently selected one
        const res = await axios.get(`/api/v1/event-labour?eventId=${selectedEventId}`);
        if (res.data.data?.length === 0) {
          setAssignedWorkers([]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete event labour record.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Labour Workforce & Wages
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Check crew attendance rosters, daily wage structures, and outstanding ledger payouts
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 focus:outline-none transition-all duration-200"
        >
          <Plus size={16} />
          Register Crew
        </button>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-premium border border-slate-200/50 dark:border-slate-800 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Total Workforce</span>
            <p className="text-lg font-bold">{stats.totalWorkers}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-premium border border-slate-200/50 dark:border-slate-800 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <UserCheck size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Present Today</span>
            <p className="text-lg font-bold">{stats.todayAttendance} / {stats.totalWorkers}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-premium border border-slate-200/50 dark:border-slate-800 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Pending Wages</span>
            <p className="text-lg font-bold text-danger">{currencySymbol}{stats.pendingLabourPayments.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-premium border border-slate-200/50 dark:border-slate-800 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Given Wages (Paid)</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{(stats.paidLabourPayments || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative uppercase tracking-wider ${
            activeTab === 'roster'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          Daily Roster & Directory
        </button>
        <button
          onClick={() => setActiveTab('eventLabour')}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative uppercase tracking-wider ${
            activeTab === 'eventLabour'
              ? 'text-primary border-b-2 border-primary'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          Event Workforce Allocations
        </button>
      </div>

      {activeTab === 'roster' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Attendance Checklist */}
          <div className="lg:col-span-2 p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckSquare size={16} className="text-primary" />
                <span>Daily Attendance Roster</span>
              </h3>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="p-1 px-2 border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-1">Worker</th>
                    <th className="py-2.5 px-1">Role</th>
                    <th className="py-2.5 px-1 text-center">Status</th>
                    <th className="py-2.5 px-1 text-right">Wage ({currencySymbol})</th>
                    <th className="py-2.5 px-1 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLoading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 shimmer-loading rounded-xl">
                        Rebuilding roster columns...
                      </td>
                    </tr>
                  ) : activeAttendanceList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        Register crew workers to populate attendance lists.
                      </td>
                    </tr>
                  ) : (
                    activeAttendanceList.map((row) => (
                      <tr key={row.workerId} className="border-b border-slate-100 dark:border-slate-800/40 last:border-b-0">
                        <td className="py-3 px-1 font-semibold">{row.workerName}</td>
                        <td className="py-3 px-1 text-slate-500">{row.role}</td>
                        <td className="py-3 px-1 text-center">
                          <select
                            value={row.status}
                            onChange={(e) => handleStatusChange(row.workerId, e.target.value)}
                            className={`bg-transparent border rounded p-1 text-[10px] font-bold outline-none ${
                              row.status === 'Present'
                                ? 'border-success/30 text-success bg-success/5'
                                : 'border-danger/20 text-danger bg-danger/5'
                            }`}
                          >
                            <option value="Absent" className="text-danger dark:bg-slate-900">Absent</option>
                            <option value="Present" className="text-success dark:bg-slate-900">Present</option>
                          </select>
                        </td>
                        <td className="py-3 px-1 text-right">
                          <input
                            type="number"
                            disabled={row.status === 'Absent'}
                            value={row.wagePaid}
                            onChange={(e) => handleAttendanceChange(row.workerId, 'wagePaid', e.target.value)}
                            className="w-16 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-right text-xs"
                          />
                        </td>
                        <td className="py-3 px-1 text-right">
                          <select
                            disabled={row.status === 'Absent'}
                            value={row.paymentStatus}
                            onChange={(e) => handleAttendanceChange(row.workerId, 'paymentStatus', e.target.value)}
                            className="bg-transparent border border-slate-200 dark:border-slate-700 rounded p-1 text-[10px]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleSaveAttendance}
                disabled={activeAttendanceList.length === 0}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium focus:outline-none transition-colors"
              >
                Save Attendance Sheet
              </button>
            </div>
          </div>

          {/* Right: Workforce Directory */}
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
            <h3 className="font-bold text-sm">Crew Directory</h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 shimmer-loading rounded-premium" />
              ) : workers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No crew registered.</div>
              ) : (
                workers.map(w => (
                  <div key={w._id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{w.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{w.role} • {currencySymbol}{w.dailyWage}/day</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenEditModal(w)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><Edit size={12} /></button>
                      <button onClick={() => handleDeleteWorker(w._id)} className="p-1 hover:bg-danger/15 rounded text-slate-400 hover:text-danger"><Trash size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Event Workforce Allocations Tab */
        <div className="space-y-6">
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Event Workforce Setup</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Select an upcoming active event to allocate crew members and record wages</p>
              </div>
              <div className="w-full md:w-80">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="">-- Choose Upcoming Event --</option>
                  {events
                    .filter(ev => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      return ev.date >= todayStr && ev.status !== 'Completed' && ev.status !== 'Cancelled';
                    })
                    .map(ev => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name} ({ev.customerName} - {ev.date})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedEventId ? (() => {
              const selectedEvent = events.find(ev => ev._id === selectedEventId);
              if (!selectedEvent) return null;
              return (
                <div className="space-y-6">
                  {/* Event Details Card */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[9px] mb-0.5">Event / Customer</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedEvent.name}</span>
                      <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Client: {selectedEvent.customerName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[9px] mb-0.5">Date</span>
                      <span className="text-slate-900 dark:text-white">{selectedEvent.date}</span>
                      <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Type: {selectedEvent.eventType || 'General'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block uppercase text-[9px] mb-0.5">Venue Address</span>
                      <span className="text-slate-800 dark:text-slate-300 block">{selectedEvent.location || 'To be confirmed'}</span>
                    </div>
                  </div>

                  {/* Selected Event Labour Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Total Event Wages</span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {currencySymbol}{assignedWorkers.reduce((sum, w) => sum + (parseFloat(w.totalSalary) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-450 uppercase block mb-0.5">Event Wages Given (Paid)</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {currencySymbol}{assignedWorkers.reduce((sum, w) => sum + (parseFloat(w.paidAmount) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50/20 dark:bg-rose-950/10 rounded-xl border border-rose-100/60 dark:border-rose-900 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase block mb-0.5">Event Balance Due</span>
                        <span className="text-sm font-extrabold text-rose-600 dark:text-rose-450">
                          {currencySymbol}{assignedWorkers.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add Worker form */}
                  <div className="flex items-end gap-3 max-w-md bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Select Worker to Assign</label>
                      <select
                        value={selectedWorkerIdToAdd}
                        onChange={(e) => setSelectedWorkerIdToAdd(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                      >
                        <option value="">-- Choose Crew worker --</option>
                        {workers.map(w => (
                          <option key={w._id} value={w._id}>
                            {w.name} ({w.role} - {currencySymbol}{w.dailyWage}/day)
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddWorkerToEvent}
                      className="p-3 bg-primary hover:bg-primary-hover text-white rounded-xl shadow-premium focus:outline-none transition-all flex items-center justify-center font-bold"
                      title="Add worker to event"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Assigned Workers Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Event Workforce ({assignedWorkers.length} workers)</h4>
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                            <th className="py-3 px-3">Crew Name</th>
                            <th className="py-3 px-2 text-right">Daily Wage ({currencySymbol})</th>
                            <th className="py-3 px-2 text-center">Days worked</th>
                            <th className="py-3 px-2 text-right">Total Wage ({currencySymbol})</th>
                            <th className="py-3 px-2 text-right">Paid Amount ({currencySymbol})</th>
                            <th className="py-3 px-2 text-right">Balance Due ({currencySymbol})</th>
                            <th className="py-3 px-2 text-center">Payment Status</th>
                            <th className="py-3 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingEventLabour ? (
                            <tr>
                              <td colSpan="8" className="py-10 text-center text-slate-400 font-semibold animate-pulse">
                                Rebuilding workforce columns...
                              </td>
                            </tr>
                          ) : assignedWorkers.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="py-12 text-center text-slate-400">
                                No workers assigned to this event yet. Use the selector above and click '+' to assign.
                              </td>
                            </tr>
                          ) : (
                            assignedWorkers.map((w, idx) => (
                              <tr key={w.workerId || idx} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-900/30">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-slate-800 dark:text-slate-100">{w.name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{w.phone || 'No phone'}</div>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={w.dailyWage}
                                    onChange={(e) => handleEventWorkerChange(w.workerId, 'dailyWage', e.target.value)}
                                    className="w-16 p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-right font-bold text-slate-900 dark:text-slate-100"
                                  />
                                </td>
                                <td className="py-3 px-2 text-center font-bold">
                                  <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={w.daysWorked}
                                    onChange={(e) => handleEventWorkerChange(w.workerId, 'daysWorked', e.target.value)}
                                    className="w-12 p-1.5 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded text-center font-bold text-slate-900 dark:text-slate-100"
                                  />
                                </td>
                                <td className="py-3 px-2 text-right font-extrabold text-slate-800 dark:text-slate-100">
                                  {currencySymbol}{(w.totalSalary || 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    value={w.paidAmount}
                                    onChange={(e) => handleEventWorkerChange(w.workerId, 'paidAmount', e.target.value)}
                                    className="w-16 p-1.5 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded text-right font-bold text-emerald-600 dark:text-emerald-400"
                                  />
                                </td>
                                <td className={`py-3 px-2 text-right font-extrabold ${
                                  (w.balance || 0) > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'
                                }`}>
                                  {currencySymbol}{(w.balance || 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    w.status === 'Paid'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {w.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveWorkerFromEvent(w.workerId)}
                                    className="p-1 text-slate-400 hover:text-danger rounded transition-colors"
                                  >
                                    <Trash size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 dark:border-slate-850 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveEventLabour}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none uppercase tracking-wider"
                    >
                      Save Workforce Ledger
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="py-12 text-center text-slate-400 font-semibold text-xs bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                Please select an upcoming active event from the dropdown to configure workforce wages.
              </div>
            )}
          </div>

          {/* Saved Workforce History Ledger */}
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Workforce History Ledger</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Overview of saved event labour configurations and payment statuses</p>
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1.5 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Search event name..."
                    value={filterEventName}
                    onChange={(e) => setFilterEventName(e.target.value)}
                    className="p-1 pl-7 border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg text-xs"
                  />
                </div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="p-1 px-2 border border-slate-200 dark:border-slate-700 bg-transparent rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-850 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 px-3">Event Name & Client</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 text-center">Crew Count</th>
                    <th className="py-2.5 px-2 text-right">Total Salary</th>
                    <th className="py-2.5 px-2 text-right">Paid Amount</th>
                    <th className="py-2.5 px-2 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eventLabourRecords.filter(rec => {
                    const matchesEventName = rec.eventName.toLowerCase().includes(filterEventName.toLowerCase()) ||
                                             (rec.customerName || '').toLowerCase().includes(filterEventName.toLowerCase());
                    const matchesDate = !filterDate || rec.eventDate === filterDate;
                    return matchesEventName && matchesDate;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No saved event labour records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    eventLabourRecords.filter(rec => {
                      const matchesEventName = rec.eventName.toLowerCase().includes(filterEventName.toLowerCase()) ||
                                               (rec.customerName || '').toLowerCase().includes(filterEventName.toLowerCase());
                      const matchesDate = !filterDate || rec.eventDate === filterDate;
                      return matchesEventName && matchesDate;
                    }).map((rec) => {
                      const totalSal = rec.workers?.reduce((sum, w) => sum + (w.totalSalary || 0), 0) || 0;
                      const totalPaid = rec.workers?.reduce((sum, w) => sum + (w.paidAmount || 0), 0) || 0;
                      const totalBal = totalSal - totalPaid;
                      return (
                        <tr key={rec._id} className="border-b border-slate-100 dark:border-slate-850/50 hover:bg-slate-50/20 dark:hover:bg-slate-900/30">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{rec.eventName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Client: {rec.customerName || '—'}</div>
                          </td>
                          <td className="py-3 px-2 text-slate-600 dark:text-slate-450 font-semibold">{rec.eventDate}</td>
                          <td className="py-3 px-2 text-center font-bold">{rec.workers?.length || 0}</td>
                          <td className="py-3 px-2 text-right font-bold text-slate-800 dark:text-slate-100">{currencySymbol}{totalSal.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{totalPaid.toFixed(2)}</td>
                          <td className={`py-3 px-2 text-right font-extrabold ${
                            totalBal > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'
                          }`}>{currencySymbol}{totalBal.toFixed(2)}</td>
                          <td className="py-3 px-3 text-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setSelectedEventId(rec.eventId)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-primary transition-colors"
                              title="Edit Workforce"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEventLabour(rec._id)}
                              className="p-1 hover:bg-danger/10 rounded text-slate-450 hover:text-danger transition-colors"
                              title="Delete Record"
                            >
                              <Trash size={12} />
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
        </div>
      )}

      {/* Creation / Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWorker ? 'Modify Worker Profile' : 'Register Crew Member'}
      >
        <form onSubmit={handleSubmitWorker} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Worker Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marcus Aurelius"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Role / Course Duty</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="Chef">Chef (Master Cook)</option>
                <option value="Server">Server (Waiting Crew)</option>
                <option value="Helper">Helper (Prep Work)</option>
                <option value="Cleaner">Cleaner (Kitchen Utility)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Daily Wage ({currencySymbol})</label>
              <input
                type="number"
                required
                value={dailyWage}
                onChange={(e) => setDailyWage(parseFloat(e.target.value) || 0)}
                placeholder="120"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs font-bold text-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="555-0920"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingWorker ? 'Modify Worker Profile' : 'Register Crew Worker'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
