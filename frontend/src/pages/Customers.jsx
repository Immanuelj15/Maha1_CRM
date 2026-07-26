import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Edit, Trash, User, Phone, 
  Mail, MapPin, Calendar, HeartHandshake, FileText, ChevronRight, DollarSign 
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

// Reusable Autocomplete Search & Select Component
const SearchSelect = ({ label, placeholder, query, setQuery, suggestions, selectedItems, onAdd, onRemove }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = query
    ? suggestions.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) && 
        !selectedItems.some(sel => sel.name === item.name)
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-1 relative">
      <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-premium max-h-48 overflow-y-auto">
          {filtered.map(item => (
            <div
              key={item._id || item.name}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents blur event from firing before click
                onAdd(item);
                setQuery('');
                setShowDropdown(false);
              }}
              className="p-2 text-xs hover:bg-primary/10 dark:hover:bg-slate-700/50 cursor-pointer text-slate-700 dark:text-slate-200 font-medium"
            >
              {item.name} {item.unit ? `(${item.unit})` : ''}
            </div>
          ))}
        </div>
      )}
      
      {/* Selected Items Tags */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {selectedItems.map(item => (
          <span 
            key={item.name}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-155 dark:bg-slate-800 text-slate-700 dark:text-slate-205 text-[10px] font-bold rounded-lg border border-slate-200/40 dark:border-slate-700/40"
          >
            {item.name}
            <button 
              type="button"
              onClick={() => onRemove(item)}
              className="text-slate-400 hover:text-danger font-bold text-xs ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        {selectedItems.length === 0 && (
          <span className="text-[10px] text-slate-400 italic">No items selected. Start typing to add.</span>
        )}
      </div>
    </div>
  );
};

export default function Customers() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'requirements'
  
  // Input fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [notes, setNotes] = useState('');

  // Billing & Payment States
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  // Vessel Rental States
  const [allVessels, setAllVessels] = useState([]);
  const [rentedVessels, setRentedVessels] = useState([]);
  const [serviceType, setServiceType] = useState('Catering');
  
  // Vessel assignment form fields
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [rentQty, setRentQty] = useState(1);
  const [rentAmount, setRentAmount] = useState(50);
  const [rentDeposit, setRentDeposit] = useState(50);
  const [vesselReturnDate, setVesselReturnDate] = useState('');

  // Auto calculate balance and status when total/discount/paid changes
  useEffect(() => {
    const bal = totalAmount - discount - paidAmount;
    setPaymentStatus(bal <= 0 ? 'Paid' : 'Pending');
  }, [totalAmount, discount, paidAmount]);

  // Set default return date
  useEffect(() => {
    if (eventDate) {
      const date = new Date(eventDate);
      date.setDate(date.getDate() + 7);
      setVesselReturnDate(date.toISOString().split('T')[0]);
    } else {
      const today = new Date();
      today.setDate(today.getDate() + 7);
      setVesselReturnDate(today.toISOString().split('T')[0]);
    }
  }, [eventDate]);

  // Automatically switch tab back if serviceType becomes Vessel Only
  useEffect(() => {
    if (serviceType === 'Vessel Only') {
      setModalTab('details');
    }
  }, [serviceType]);

  const handleAddVessel = () => {
    if (!selectedVesselId) {
      toast.error('Please select a vessel item.');
      return;
    }
    const vessel = allVessels.find(v => v._id === selectedVesselId);
    if (!vessel) return;

    if (vessel.availableQty < rentQty) {
      toast.error(`Only ${vessel.availableQty} available in stock.`);
      return;
    }

    if (rentedVessels.some(rv => rv.vesselId === selectedVesselId)) {
      toast.error('This vessel has already been added.');
      return;
    }

    const newRented = [...rentedVessels, {
      vesselId: selectedVesselId,
      vesselName: vessel.name,
      size: vessel.size,
      qty: rentQty,
      rentAmount,
      deposit: rentDeposit,
      returnDate: vesselReturnDate
    }];

    setRentedVessels(newRented);
    const addedCost = (rentQty * rentAmount) + (rentQty * rentDeposit);
    setTotalAmount(prev => prev + addedCost);

    setSelectedVesselId('');
    setRentQty(1);
    setRentAmount(50);
    setRentDeposit(50);
  };

  const handleRemoveVessel = (idx) => {
    const item = rentedVessels[idx];
    const removedCost = (item.qty * item.rentAmount) + (item.qty * item.deposit);
    setTotalAmount(prev => Math.max(0, prev - removedCost));
    setRentedVessels(rentedVessels.filter((_, i) => i !== idx));
  };

  // Selected lists
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedVeg, setSelectedVeg] = useState([]);
  const [selectedGroc, setSelectedGroc] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]); // full combo objects

  // Menu mode toggle: 'normal' (individual dishes) | 'combo' (combo packs)
  const [menuMode, setMenuMode] = useState('normal');

  // Search input queries
  const [menuSearch, setMenuSearch] = useState('');
  const [comboSearch, setComboSearch] = useState('');
  const [vegSearch, setVegSearch] = useState('');
  const [grocSearch, setGrocSearch] = useState('');

  // Suggestions arrays
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [allCombos, setAllCombos] = useState([]);
  const [allVegetableItems, setAllVegetableItems] = useState([]);
  const [allGroceryItems, setAllGroceryItems] = useState([]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/customers?search=${search}`);
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  // Load autocompletes when the modal is opened
  useEffect(() => {
    if (!isModalOpen) return;
    const loadAutocompletes = async () => {
      try {
        const [menuRes, groceryRes, comboRes, vesselRes] = await Promise.all([
          axios.get('/api/v1/menu-items'),
          axios.get('/api/v1/groceries'),
          axios.get('/api/v1/combos'),
          axios.get('/api/v1/vessels')
        ]);
        setAllMenuItems(menuRes.data.data || []);
        const inv = groceryRes.data.data || [];
        setAllVegetableItems(inv.filter(g => g.category === 'Vegetables'));
        setAllGroceryItems(inv.filter(g => g.category !== 'Vegetables'));
        setAllCombos(comboRes.data.data || []);
        setAllVessels(vesselRes.data.data || []);
      } catch (err) {
        console.error('Error loading autocomplete data:', err);
      }
    };
    loadAutocompletes();
  }, [isModalOpen]);

  // Handle customer side-profile card loading
  useEffect(() => {
    if (!selectedCustomerId) {
      setProfileData(null);
      return;
    }
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await axios.get(`/api/v1/customers/${selectedCustomerId}`);
        setProfileData(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load profile analytics.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [selectedCustomerId]);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setEventType('Wedding');
    setEventName('');
    setEventDate('');
    setGuestCount(50);
    setNotes('');

    // Reset lists
    setSelectedMenus([]);
    setSelectedVeg([]);
    setSelectedGroc([]);
    setSelectedCombos([]);
    setMenuSearch('');
    setComboSearch('');
    setVegSearch('');
    setGrocSearch('');
    setMenuMode('normal');

    setTotalAmount(0);
    setDiscount(0);
    setPaidAmount(0);
    setPaymentStatus('Pending');
    setServiceType('Catering');
    setRentedVessels([]);

    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setAddress(c.address || '');
    setEventType(c.eventType || 'Wedding');
    setEventName(c.eventName || '');
    setEventDate(c.eventDate || '');
    setGuestCount(c.guestCount || 50);
    setNotes(c.notes || '');

    // Set selections
    setSelectedMenus(c.menuItems || []);
    setSelectedVeg(c.vegetables || []);
    setSelectedGroc(c.groceries || []);
    setMenuSearch('');
    setComboSearch('');
    setVegSearch('');
    setGrocSearch('');
    setSelectedCombos([]);
    setMenuMode('normal');

    setTotalAmount(c.totalAmount || 0);
    setDiscount(c.discount || 0);
    setPaidAmount(c.paidAmount || 0);
    setPaymentStatus(c.paymentStatus || 'Pending');
    setServiceType(c.serviceType || 'Catering');
    setRentedVessels(c.rentedVessels || []);

    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { 
      name, phone, email, address, eventType, eventDate, guestCount, notes, eventName,
      menuItems: (serviceType === 'Catering' || serviceType === 'Both') ? selectedMenus : [],
      vegetables: (serviceType === 'Catering' || serviceType === 'Both') ? selectedVeg : [],
      groceries: (serviceType === 'Catering' || serviceType === 'Both') ? selectedGroc : [],
      totalAmount,
      discount,
      paidAmount,
      paymentStatus,
      serviceType,
      rentedVessels
    };
    try {
      if (editingCustomer) {
        await axios.put(`/api/v1/customers/${editingCustomer._id}`, payload);
        toast.success('Customer updated! Event & Invoice auto-synced if needed.');
      } else {
        await axios.post('/api/v1/customers', payload);
        toast.success('Customer registered! Event & Invoice auto-booked.');
      }
      setIsModalOpen(false);
      fetchCustomers();
      if (selectedCustomerId && editingCustomer && selectedCustomerId === editingCustomer._id) {
        setSelectedCustomerId(null);
        setTimeout(() => setSelectedCustomerId(editingCustomer._id), 100);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer.');
    }
  };

  // Manually sync event+invoice for existing customer who has no event yet
  const handleSyncEventInvoice = async (customer) => {
    if (!customer.eventDate || !customer.eventType) {
      toast.error('Please edit the customer and set an Event Type and Date first.');
      return;
    }
    try {
      await axios.put(`/api/v1/customers/${customer._id}`, {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        eventType: customer.eventType,
        eventDate: customer.eventDate,
        guestCount: customer.guestCount,
        notes: customer.notes,
        menuItems: customer.menuItems || [],
        vegetables: customer.vegetables || [],
        groceries: customer.groceries || []
      });
      toast.success('Event & Invoice created successfully!');
      // Reload the profile card
      setSelectedCustomerId(null);
      setTimeout(() => setSelectedCustomerId(customer._id), 100);
    } catch (err) {
      toast.error('Failed to sync event & invoice.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await axios.delete(`/api/v1/customers/${id}`);
      toast.success('Customer deleted.');
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Could not delete customer.');
    }
  };

  // Compute filtered customers list
  const filteredCustomers = serviceFilter === 'All'
    ? customers
    : customers.filter(c => (c.serviceType || 'Catering') === serviceFilter);

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Customers Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your client portfolio
          </p>
        </div>
      </div>

      {/* Search Header + Service Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex items-center max-w-md w-full sm:flex-1">
          <Search size={16} className="absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, email, or telephone number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-sm focus:border-primary transition-all duration-200"
          />
        </div>

        {/* Service Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'All Clients', value: 'All', color: 'slate' },
            { label: '🍽 Catering', value: 'Catering', color: 'primary' },
            { label: '🪣 Vessel Only', value: 'Vessel Only', color: 'secondary' },
            { label: '🔀 Both Services', value: 'Both', color: 'amber' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setServiceFilter(filter.value)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all border ${
                serviceFilter === filter.value
                  ? filter.value === 'All'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-sm'
                    : filter.value === 'Catering'
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : filter.value === 'Vessel Only'
                    ? 'bg-secondary border-secondary text-white shadow-sm'
                    : 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {filter.label}
              <span className="ml-1.5 font-normal opacity-75">
                ({filter.value === 'All'
                  ? customers.length
                  : customers.filter(c => {
                      const st = c.serviceType || 'Catering';
                      return filter.value === 'Both' ? st === 'Both' : st === filter.value;
                    }).length
                })
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table - Full Screen */}
      <div className="w-full">
        <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Phone</th>
                  <th className="py-3 px-2 hidden sm:table-cell">Email</th>
                  <th className="py-3 px-2 hidden md:table-cell">Service Type</th>
                  <th className="py-3 px-2 hidden lg:table-cell">Event Date</th>
                  <th className="py-3 px-2 hidden lg:table-cell text-right">Total (₹)</th>
                  <th className="py-3 px-2 hidden lg:table-cell text-right">Discount (₹)</th>
                  <th className="py-3 px-2 hidden lg:table-cell text-right">Paid (₹)</th>
                  <th className="py-3 px-2 hidden lg:table-cell text-right">Balance (₹)</th>
                  <th className="py-3 px-2 hidden xl:table-cell">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="py-8 text-center text-slate-400 shimmer-loading rounded-xl">
                      Accessing customers database...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-8 text-center text-slate-400">
                      No {serviceFilter === 'All' ? '' : `"${serviceFilter}"`} customer records found{search ? ` matching "${search}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const balance = (c.totalAmount || 0) - (c.discount || 0) - (c.paidAmount || 0);
                    return (
                      <tr
                        key={c._id}
                        onClick={() => {
                          setSelectedCustomerId(c._id);
                          setIsDetailsOpen(true);
                        }}
                        className="border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-primary/5 dark:hover:bg-slate-800/40 transition-all duration-150 cursor-pointer"
                      >
                        <td className="py-3 px-2 flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                            (c.serviceType || 'Catering') === 'Vessel Only'
                              ? 'bg-secondary/10 text-secondary dark:bg-secondary/20'
                              : (c.serviceType || 'Catering') === 'Both'
                              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                              : 'bg-primary/10 text-primary dark:bg-primary/20'
                          }`}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                        </td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{c.phone}</td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400 hidden sm:table-cell">{c.email}</td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (c.serviceType || 'Catering') === 'Vessel Only'
                              ? 'bg-secondary/10 text-secondary'
                              : (c.serviceType || 'Catering') === 'Both'
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {c.serviceType || 'Catering'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 hidden lg:table-cell">{c.eventDate || '—'}</td>
                        <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-100 hidden lg:table-cell text-right">
                          ₹{(c.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-slate-400 hidden lg:table-cell text-right">
                          ₹{(c.discount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-2 font-bold text-emerald-600 dark:text-emerald-400 hidden lg:table-cell text-right">
                          ₹{(c.paidAmount || 0).toFixed(2)}
                        </td>
                        <td className={`py-3 px-2 font-extrabold hidden lg:table-cell text-right ${
                          balance > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'
                        }`}>
                          ₹{balance.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 hidden xl:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.paymentStatus === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {c.paymentStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-all duration-150"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1.5 hover:bg-danger/10 rounded-lg text-slate-500 hover:text-danger transition-all duration-150"
                          >
                            <Trash size={14} />
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

      {/* Add / Edit Modal Drawer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Modify Customer Profile' : 'Register New Client'}
      >
        <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <button
            type="button"
            onClick={() => setModalTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              modalTab === 'details' 
                ? 'bg-primary text-white' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
            }`}
          >
            Basic Details
          </button>
          {(serviceType === 'Catering' || serviceType === 'Both') && (
            <button
              type="button"
              onClick={() => setModalTab('requirements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modalTab === 'requirements' 
                  ? 'bg-primary text-white' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
            >
              Requirements ({selectedMenus.length + selectedCombos.length + selectedVeg.length + selectedGroc.length})
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modalTab === 'details' ? (
            <>
              {/* Service Type Selection */}
              <div className="space-y-1 mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Service Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('Catering');
                      if (eventType === 'Vessel Rental') setEventType('Wedding');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border ${
                      serviceType === 'Catering'
                        ? 'bg-primary border-primary text-white shadow-premium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-605 dark:text-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    Catering Services
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('Vessel Only');
                      setEventType('Vessel Rental');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border ${
                      serviceType === 'Vessel Only'
                        ? 'bg-secondary border-secondary text-white shadow-premium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-605 dark:text-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    Vessel Only (Rental)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('Both');
                      if (eventType === 'Vessel Rental') setEventType('Wedding');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border ${
                      serviceType === 'Both'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-premium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-605 dark:text-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    Both Services
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Client Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 86828 41582"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full street location details..."
                  rows="2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="E.g., Anitha's Wedding Reception"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-800 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Engagement">Engagement</option>
                    <option value="General">General Party</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Guests</label>
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, visual decorations, menu remarks..."
                  rows="2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
                />
              </div>

              {/* Billing & Payment Details */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Billing & Payment Details</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-800 dark:text-slate-100 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-800 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Paid Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs text-slate-800 dark:text-slate-100 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Balance (₹)</label>
                  <input
                    type="number"
                    readOnly
                    value={totalAmount - discount - paidAmount}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* SECTION: Vessel Rental Requirements */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Vessel Rental Requirements</h4>
                
                {/* Select and Add Vessel Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Select Vessel</label>
                    <select
                      value={selectedVesselId}
                      onChange={(e) => setSelectedVesselId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="">-- Choose Vessel Asset --</option>
                      {allVessels.map(v => (
                        <option key={v._id} value={v._id} disabled={v.availableQty <= 0}>
                          {v.name} ({v.size}) - {v.availableQty} available
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rent Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={rentQty}
                      onChange={(e) => setRentQty(parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rent (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 text-xs text-slate-800 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Deposit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={rentDeposit}
                      onChange={(e) => setRentDeposit(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 text-xs text-slate-800 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Return Date</label>
                    <input
                      type="date"
                      value={vesselReturnDate}
                      onChange={(e) => setVesselReturnDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVessel}
                    className="col-span-2 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all focus:outline-none mt-2"
                  >
                    Add Vessel to Rental Agreement
                  </button>
                </div>

                {/* Selected Vessels Table */}
                {rentedVessels.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-[10px]">
                    <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                          <th className="p-2">Name</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2">Cost (₹)</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentedVessels.map((rv, idx) => {
                          const totalCost = rv.qty * rv.rentAmount + rv.qty * rv.deposit;
                          return (
                            <tr key={idx} className="border-b border-slate-150 dark:border-slate-800 last:border-b-0">
                              <td className="p-2 font-semibold">{rv.vesselName}</td>
                              <td className="p-2 font-bold">{rv.qty}</td>
                              <td className="p-2 font-bold text-primary">₹{totalCost}</td>
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVessel(idx)}
                                  className="text-rose-500 hover:text-rose-700 font-bold"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* ── MENU SECTION with Combo / Normal toggle ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Menu Selection</label>
                  {/* Toggle Pills */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setMenuMode('normal'); setComboSearch(''); }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        menuMode === 'normal'
                          ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      🍽 Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuMode('combo'); setMenuSearch(''); }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        menuMode === 'combo'
                          ? 'bg-white dark:bg-slate-700 text-secondary shadow-sm'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      🎁 Combo
                    </button>
                  </div>
                </div>

                {menuMode === 'normal' ? (
                  // Normal individual dish selector
                  <SearchSelect
                    label=""
                    placeholder="Type to filter sweets, meals, main courses..."
                    query={menuSearch}
                    setQuery={setMenuSearch}
                    suggestions={allMenuItems}
                    selectedItems={selectedMenus}
                    onAdd={(item) => setSelectedMenus([...selectedMenus, { name: item.name }])}
                    onRemove={(item) => setSelectedMenus(selectedMenus.filter(m => m.name !== item.name))}
                  />
                ) : (
                  // Combo pack selector
                  <div className="space-y-1 relative">
                    <SearchSelect
                      label=""
                      placeholder="Type combo name (e.g. Traditional Lunch, Tiffin Pack)..."
                      query={comboSearch}
                      setQuery={setComboSearch}
                      suggestions={allCombos.map(c => ({ ...c, unit: c.category }))}
                      selectedItems={selectedCombos.map(c => ({ name: c.name }))}
                      onAdd={(item) => {
                        const combo = allCombos.find(c => c.name === item.name);
                        if (!combo) return;
                        if (selectedCombos.some(c => c.name === combo.name)) return;
                        setSelectedCombos([...selectedCombos, combo]);
                        // Also expand combo items into selectedMenus for storage
                        const newItems = (combo.items || []).map(dishName => ({ name: dishName, fromCombo: combo.name }));
                        const merged = [...selectedMenus];
                        newItems.forEach(ni => {
                          if (!merged.some(m => m.name === ni.name)) merged.push(ni);
                        });
                        setSelectedMenus(merged);
                      }}
                      onRemove={(item) => {
                        const combo = selectedCombos.find(c => c.name === item.name);
                        setSelectedCombos(selectedCombos.filter(c => c.name !== item.name));
                        if (combo) {
                          // Remove all items that came from this combo
                          setSelectedMenus(selectedMenus.filter(m => m.fromCombo !== combo.name));
                        }
                      }}
                    />

                    {/* Preview expanded combo items */}
                    {selectedCombos.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedCombos.map(combo => (
                          <div key={combo.name} className="p-2.5 rounded-xl bg-secondary/5 dark:bg-secondary/10 border border-secondary/20">
                            <p className="text-[10px] font-bold text-secondary uppercase mb-1.5">
                              🎁 {combo.name} <span className="font-normal text-slate-400">({combo.category})</span>
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(combo.items || []).map(dish => (
                                <span key={dish} className="px-2 py-0.5 bg-white dark:bg-slate-800 text-[9px] rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                  {dish}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <SearchSelect
                  label="Vegetables Selection"
                  placeholder="Type name to filter Beans, Carrots, Onions..."
                  query={vegSearch}
                  setQuery={setVegSearch}
                  suggestions={allVegetableItems}
                  selectedItems={selectedVeg}
                  onAdd={(item) => setSelectedVeg([...selectedVeg, { name: item.name, qty: 1, unit: item.unit || 'kg' }])}
                  onRemove={(item) => setSelectedVeg(selectedVeg.filter(v => v.name !== item.name))}
                  hideTags={true}
                />
                
                {selectedVeg.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">Selected Vegetables:</p>
                    {selectedVeg.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.qty !== undefined ? item.qty : 1}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...selectedVeg];
                              updated[idx].qty = val;
                              setSelectedVeg(updated);
                            }}
                            className="w-14 p-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-100"
                          />
                          <select
                            value={item.unit || 'kg'}
                            onChange={(e) => {
                              const updated = [...selectedVeg];
                              updated[idx].unit = e.target.value;
                              setSelectedVeg(updated);
                            }}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-semibold"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setSelectedVeg(selectedVeg.filter(v => v.name !== item.name))}
                            className="p-1 text-slate-400 hover:text-danger font-extrabold text-sm ml-0.5"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <SearchSelect
                  label="Groceries & Spices Selection"
                  placeholder="Type name to filter rice, dairy, chili powder..."
                  query={grocSearch}
                  setQuery={setGrocSearch}
                  suggestions={allGroceryItems}
                  selectedItems={selectedGroc}
                  onAdd={(item) => setSelectedGroc([...selectedGroc, { name: item.name, qty: 1, unit: item.unit || 'kg' }])}
                  onRemove={(item) => setSelectedGroc(selectedGroc.filter(g => g.name !== item.name))}
                  hideTags={true}
                />

                {selectedGroc.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">Selected Groceries:</p>
                    {selectedGroc.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.qty !== undefined ? item.qty : 1}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...selectedGroc];
                              updated[idx].qty = val;
                              setSelectedGroc(updated);
                            }}
                            className="w-14 p-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 font-bold text-slate-900 dark:text-slate-100"
                          />
                          <select
                            value={item.unit || 'kg'}
                            onChange={(e) => {
                              const updated = [...selectedGroc];
                              updated[idx].unit = e.target.value;
                              setSelectedGroc(updated);
                            }}
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 font-semibold"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setSelectedGroc(selectedGroc.filter(g => g.name !== item.name))}
                            className="p-1 text-slate-400 hover:text-danger font-extrabold text-sm ml-0.5"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
            >
              {editingCustomer ? 'Save Customer Profiles' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Details & Printable Requirements Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedCustomerId(null);
        }}
        title="Customer Requirements & Work Order Details"
      >
        {profileLoading ? (
          <div className="py-8 text-center text-slate-400 font-semibold text-xs animate-pulse">
            Accessing customer details...
          </div>
        ) : profileData && profileData.customer ? (() => {
          const c = profileData.customer;
          return (
            <div className="space-y-6 text-slate-800 dark:text-slate-200">
              {/* Header Info Grid */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5">
                <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-800 pb-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">{c.name}</h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{c.phone} | {c.email || 'No email'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {c.paymentStatus}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <div><span className="font-bold text-slate-400 uppercase tracking-wide mr-1">Event Date:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{c.eventDate || '—'}</span></div>
                  <div><span className="font-bold text-slate-400 uppercase tracking-wide mr-1">Event Type:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{c.eventType || '—'}</span></div>
                  <div><span className="font-bold text-slate-400 uppercase tracking-wide mr-1">Guests:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{c.guestCount || '—'}</span></div>
                  <div><span className="font-bold text-slate-400 uppercase tracking-wide mr-1">Service:</span> <span className="font-bold text-slate-800 dark:text-slate-100">{c.serviceType || 'Catering'}</span></div>
                  <div className="col-span-2"><span className="font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Address:</span> <span className="font-medium text-slate-800 dark:text-slate-150 block bg-white dark:bg-slate-955 p-2 rounded border border-slate-200/80 dark:border-slate-850">{c.address || '—'}</span></div>
                  {c.notes && (
                    <div className="col-span-2"><span className="font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Notes:</span> <span className="font-medium text-slate-700 dark:text-slate-300 block italic bg-amber-50/40 dark:bg-slate-950/20 p-2 rounded border border-amber-100/30 dark:border-slate-800/30">{c.notes}</span></div>
                  )}
                </div>
              </div>

              {/* Categorised Items */}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                
                {/* 1. Food Menu Items */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-extrabold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                    🍽️ Menu Dishes ({c.menuItems?.length || 0})
                  </h5>
                  {(!c.menuItems || c.menuItems.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No menu items ordered.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {c.menuItems.map((item, idx) => {
                        const name = typeof item === 'string' ? item : (item.name || '');
                        return (
                          <span key={idx} className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold rounded-lg shadow-sm">
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Vegetables */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-1">
                    🥬 Vegetables ({c.vegetables?.length || 0})
                  </h5>
                  {(!c.vegetables || c.vegetables.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No vegetables selected.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {c.vegetables.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                          <span className="text-emerald-700 dark:text-emerald-450 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900/40">{item.qty || '—'} {item.unit || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Groceries & Spices */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider border-b border-amber-500/20 pb-1">
                    🥫 Groceries & Spices ({c.groceries?.length || 0})
                  </h5>
                  {(!c.groceries || c.groceries.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No grocery items selected.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {c.groceries.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-lg font-bold">
                          <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                          <span className="text-amber-700 dark:text-amber-450 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900/40">{item.qty || '—'} {item.unit || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      toast.loading('Preparing Customer PDF...', { id: 'cust-pdf' });
                      const res = await axios.get(`/api/v1/customers/${c._id}/pdf`, { responseType: 'blob' });
                      const blob = new Blob([res.data], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Customer-${c.name || c._id}-Requirements.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                      toast.success('PDF Downloaded!', { id: 'cust-pdf' });
                    } catch (err) {
                      console.error('Customer PDF error:', err);
                      toast.error('Failed to download customer PDF.', { id: 'cust-pdf' });
                    }
                  }}
                  className="flex-1 py-3 bg-[#5A1827] hover:bg-[#48121E] text-white text-xs font-bold rounded-xl shadow-premium transition-all duration-200 flex items-center justify-center gap-1.5 uppercase tracking-wide border border-transparent focus:outline-none"
                >
                  <FileText size={15} />
                  Print Requirements (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setSelectedCustomerId(null);
                  }}
                  className="px-6 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-xs font-bold rounded-xl transition-all focus:outline-none uppercase tracking-wide"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })() : (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            Failed to load requirements profile.
          </div>
        )}
      </Modal>
    </div>
  );
}
