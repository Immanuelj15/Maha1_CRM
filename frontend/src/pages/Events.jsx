import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Calendar as CalendarIcon, MapPin, 
  Users, CheckCircle2, AlertCircle, Copy, Trash, Edit, ChefHat 
} from 'lucide-react';
import axios from 'axios';
import Modal from '../components/Modal';
import MenuPlanner from '../components/MenuPlanner';
import CalendarWidget from '../components/CalendarWidget';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Inquiry', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // kanban | list | calendar
  
  // Selected event for deep editing (Menu / Timeline)
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Create / Edit modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Event Form fields
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [guestCount, setGuestCount] = useState(50);
  const [eventType, setEventType] = useState('Wedding');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [eventRes, custRes] = await Promise.all([
        axios.get('/api/v1/events'),
        axios.get('/api/v1/customers')
      ]);
      setEvents(eventRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch individual details when selected (for menu updating)
  const fetchSelectedEvent = async (id) => {
    try {
      const res = await axios.get(`/api/v1/events/${id}`);
      setSelectedEvent(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load event details.');
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchSelectedEvent(selectedEventId);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId]);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setName('');
    setCustomerId(customers[0]?._id || '');
    setLocation('');
    setDate('');
    setGuestCount(50);
    setEventType('Wedding');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev) => {
    setEditingEvent(ev);
    setName(ev.name);
    setCustomerId(ev.customerId || '');
    setLocation(ev.location || '');
    setDate(ev.date);
    setGuestCount(ev.guestCount || 50);
    setEventType(ev.eventType || 'Wedding');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name, customerId, location, date, guestCount, eventType };
    try {
      if (editingEvent) {
        await axios.put(`/api/v1/events/${editingEvent._id}`, payload);
        toast.success('Event details saved!');
      } else {
        await axios.post('/api/v1/events', payload);
        toast.success('Event booked successfully!');
      }
      setIsModalOpen(false);
      fetchEvents();
      if (selectedEventId && editingEvent && selectedEventId === editingEvent._id) {
        fetchSelectedEvent(editingEvent._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error booking event.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? All menu plans will be wiped.')) return;
    try {
      await axios.delete(`/api/v1/events/${id}`);
      toast.success('Event cancelled & deleted.');
      if (selectedEventId === id) setSelectedEventId(null);
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`/api/v1/events/${id}`, { status });
      toast.success(`Event status updated: ${status}`);
      fetchEvents();
      if (selectedEventId === id) {
        setSelectedEvent(prev => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error('Could not shift status.');
    }
  };

  const handleDuplicate = async (ev) => {
    try {
      const newDate = window.prompt('Enter Date for Duplicated Event (YYYY-MM-DD):', ev.date);
      if (!newDate) return;
      await axios.post(`/api/v1/events/${ev._id}/duplicate`, {
        name: `${ev.name} (Copy)`,
        date: newDate
      });
      toast.success('Event menu duplicated successfully!');
      fetchEvents();
    } catch (err) {
      toast.error('Duplication failed.');
    }
  };

  const handleUpdateMenu = async (updatedMenuPlan) => {
    try {
      const res = await axios.put(`/api/v1/events/${selectedEventId}/menu`, {
        menuPlan: updatedMenuPlan
      });
      if (res.data.success) {
        setSelectedEvent(prev => ({ ...prev, menuPlan: updatedMenuPlan }));
        toast.success('Event Menu Plan saved!');
        fetchEvents();
      }
    } catch (err) {
      toast.error('Failed to save menu plan.');
    }
  };

  // Compile and download grocery sheet PDF
  const handleDownloadGroceryPDF = (id) => {
    // We can open the compile API PDF stream directly in a new window/tab
    window.open(`/api/v1/events/${id}/groceries?download=true`, '_blank');
    toast.success('Compiling grocery list download...');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Catering Bookings & Events
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track menus, guests, location logs, and status pipelines
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 focus:outline-none transition-all duration-200"
        >
          <Plus size={16} />
          Book Event
        </button>
      </div>

      {/* Toolbar / Layout Views Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-white dark:bg-slate-900 p-1 border border-slate-200/50 dark:border-slate-800 rounded-xl shadow-sm text-xs">
          {['kanban', 'list', 'calendar'].map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-4 py-2 rounded-lg font-bold capitalize transition-all duration-150 ${
                viewMode === v
                  ? 'bg-primary text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              {v} View
            </button>
          ))}
        </div>
      </div>

      {/* Main Board view workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className={`xl:col-span-3 ${selectedEventId ? 'xl:col-span-2' : 'xl:col-span-4'}`}>
          {/* 1. KANBAN COLUMN PIPELINES */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {STATUS_OPTIONS.map((colStatus) => {
                const columnEvents = events.filter(e => e.status === colStatus);
                return (
                  <div key={colStatus} className="p-3 bg-slate-100/50 dark:bg-slate-900/40 rounded-premium border border-slate-200/30 dark:border-slate-800/40 min-h-[300px] flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 dark:border-slate-800 pb-1.5 px-1">
                      <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{colStatus}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800">{columnEvents.length}</span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                      {columnEvents.map(ev => (
                        <div
                          key={ev._id}
                          onClick={() => setSelectedEventId(ev._id)}
                          className={`p-4 bg-white dark:bg-slate-900 rounded-premium border shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                            selectedEventId === ev._id ? 'border-primary' : 'border-slate-100 dark:border-slate-800/60'
                          }`}
                        >
                          <h4 className="text-xs font-bold truncate">{ev.name}</h4>
                          <div className="space-y-1.5 mt-3 text-[10px] text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon size={12} className="text-slate-400" />
                              <span>{ev.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-slate-400" />
                              <span className="truncate">{ev.location || 'No Location'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users size={12} className="text-slate-400" />
                              <span>{ev.guestCount} guests</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 mt-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-bold uppercase">{ev.eventType}</span>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleDuplicate(ev)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><Copy size={10} /></button>
                              <button onClick={() => handleOpenEditModal(ev)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><Edit size={10} /></button>
                              <button onClick={() => handleDelete(ev._id)} className="p-1 hover:bg-danger/10 rounded text-slate-400 hover:text-danger"><Trash size={10} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. FLAT SPREADSHEET LIST */}
          {viewMode === 'list' && (
            <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                      <th className="py-3 px-2">Event</th>
                      <th className="py-3 px-2">Client</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Guests</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr
                        key={ev._id}
                        onClick={() => setSelectedEventId(ev._id)}
                        className={`border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-primary/5 cursor-pointer transition-all duration-150 ${selectedEventId === ev._id ? 'bg-primary/5 font-semibold' : ''}`}
                      >
                        <td className="py-3 px-2 font-bold text-primary dark:text-secondary">{ev.name}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{ev.customerName || 'N/A'}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{ev.date}</td>
                        <td className="py-3 px-2 font-medium">{ev.guestCount}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            ev.status === 'Confirmed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>{ev.status}</span>
                        </td>
                        <td className="py-3 px-2 text-right space-x-1" onClick={e => e.stopPropagation()}>
                          <select
                            value={ev.status}
                            onChange={(e) => handleStatusChange(ev._id, e.target.value)}
                            className="bg-transparent border border-slate-200 dark:border-slate-800 rounded p-1 text-[10px]"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CALENDAR LAYOUT */}
          {viewMode === 'calendar' && (
            <CalendarWidget events={events} />
          )}
        </div>

        {/* DETAILED EVENT DRAWER (MENU & GROCERY COMPILER) */}
        {selectedEventId && selectedEvent && (
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-6 xl:col-span-2 relative">
            <button 
              onClick={() => setSelectedEventId(null)}
              className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Close Panel
            </button>

            {/* Header info */}
            <div>
              <h3 className="font-bold text-base">{selectedEvent.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1">{selectedEvent.date} • {selectedEvent.location}</p>
              
              <div className="flex gap-2 items-center mt-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Status:</span>
                <select
                  value={selectedEvent.status}
                  onChange={(e) => handleStatusChange(selectedEvent._id, e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 px-2 text-xs font-bold text-primary"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button
                  onClick={() => handleDownloadGroceryPDF(selectedEvent._id)}
                  className="ml-auto px-3 py-1 bg-secondary hover:bg-secondary-hover text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5 focus:outline-none"
                >
                  <ChefHat size={12} />
                  Print Grocery Sheet
                </button>
              </div>
            </div>

            {/* Menu Planner Component Integration */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Course Menu Planner</h4>
              <MenuPlanner
                guestCount={selectedEvent.guestCount}
                menuPlan={selectedEvent.menuPlan}
                onUpdateMenu={handleUpdateMenu}
              />
            </div>
          </div>
        )}
      </div>

      {/* Creation / Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Modify Event Details' : 'Book Catering Event'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Event Title / Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jenkins Corporate Luncheon"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Billing Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="">-- Select Client --</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Event Venue Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Gourmet Plaza, Hall 4"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="Wedding">Wedding</option>
                <option value="Birthday">Birthday</option>
                <option value="Corporate">Corporate</option>
                <option value="Anniversary">Anniversary</option>
                <option value="General">General</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Guest Count</label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingEvent ? 'Save Event Settings' : 'Confirm Reservation'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
