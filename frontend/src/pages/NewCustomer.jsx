import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Plus, DollarSign, Trash } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Reusable Autocomplete Search & Select Component
const SearchSelect = ({ label, placeholder, query, setQuery, suggestions, selectedItems, onAdd, onRemove, hideTags, allowCustom }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = query
    ? suggestions.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) && 
        !selectedItems.some(sel => sel.name === item.name)
      ).slice(0, 8)
    : [];

  return (
    <div className="space-y-1 relative">
      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-50 placeholder-slate-500"
        />
        {allowCustom && query && !suggestions.some(s => s.name.toLowerCase() === query.toLowerCase()) && (
          <button
            type="button"
            onClick={() => {
              onAdd({ name: query, unitCost: 120, category: 'Custom' });
              setQuery('');
              setShowDropdown(false);
            }}
            className="px-3 bg-primary text-slate-900 text-xs font-extrabold rounded-lg hover:bg-primary/95 transition-colors"
          >
            Add Custom
          </button>
        )}
      </div>

      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto text-sm font-semibold">
          {filtered.map((item) => (
            <div
              key={item._id || item.name}
              onClick={() => {
                onAdd(item);
                setQuery('');
                setShowDropdown(false);
              }}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-200 dark:border-slate-800 last:border-b-0 flex justify-between text-slate-900 dark:text-slate-100"
            >
              <span className="font-extrabold text-slate-900 dark:text-slate-50">{item.name}</span>
              {item.stock !== undefined && (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Stock: {item.stock} {item.unit}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showDropdown && query && filtered.length === 0 && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-700 rounded-lg shadow-lg p-3 text-center text-slate-600 dark:text-slate-300 text-sm font-semibold"
          onClick={() => setShowDropdown(false)}
        >
          No matching items found.
        </div>
      )}

      {!hideTags && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedItems.map((item, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm"
            >
              {item.name}
              <button 
                type="button" 
                onClick={() => onRemove(item)}
                className="text-slate-650 dark:text-slate-400 hover:text-red-500 font-extrabold text-xs ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default function NewCustomer() {
  const navigate = useNavigate();

  // Basic Details States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState(50);
  const [notes, setNotes] = useState('');

  // Billing & Payment States
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  // Service Category Toggle: Catering vs Vessel Only
  const [serviceType, setServiceType] = useState('Catering');

  // Selected Lists for Requirements
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [selectedVeg, setSelectedVeg] = useState([]);
  const [selectedGroc, setSelectedGroc] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState([]);
const [breakfastSearch, setBreakfastSearch] = useState('');
const [lunchSearch, setLunchSearch] = useState('');
const [dinnerSearch, setDinnerSearch] = useState('');
const [selectedBreakfast, setSelectedBreakfast] = useState([]);
const [selectedLunch, setSelectedLunch] = useState([]);
const [selectedDinner, setSelectedDinner] = useState([]);


  // Vessel Rental States
  const [allVessels, setAllVessels] = useState([]);
  const [rentedVessels, setRentedVessels] = useState([]);

  // Vessel assignment form fields
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [rentQty, setRentQty] = useState(1);
  const [rentAmount, setRentAmount] = useState(50);
  const [rentDeposit, setRentDeposit] = useState(50);
  const [vesselReturnDate, setVesselReturnDate] = useState('');

  // Search terms
  const [menuSearch, setMenuSearch] = useState('');
  const [comboSearch, setComboSearch] = useState('');
  const [vegSearch, setVegSearch] = useState('');
  const [grocSearch, setGrocSearch] = useState('');

  // Autocomplete suggestions lists
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [allCombos, setAllCombos] = useState([]);
  const [allVegetableItems, setAllVegetableItems] = useState([]);
  const [allGroceryItems, setAllGroceryItems] = useState([]);

  const [saving, setSaving] = useState(false);

  // Auto calculate balance and status when total/discount/paid changes
  useEffect(() => {
    const bal = totalAmount - discount - paidAmount;
    setPaymentStatus(bal <= 0 ? 'Paid' : 'Pending');
  }, [totalAmount, discount, paidAmount]);

  // Set default return date based on event date
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

  // Load Autocomplete data
  useEffect(() => {
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
  }, []);

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

  const handleAddCombo = (combo) => {
    setSelectedCombos([...selectedCombos, combo]);
    const newItems = [...selectedMenus];
    (combo.items || []).forEach(dishName => {
      const foundItem = allMenuItems.find(m => m.name.toLowerCase() === dishName.toLowerCase());
      if (foundItem) {
        if (!newItems.some(existing => existing.name === foundItem.name)) {
          newItems.push(foundItem);
        }
      } else {
        if (!newItems.some(existing => existing.name === dishName)) {
          newItems.push({
            name: dishName,
            unitCost: 120,
            course: combo.course || 'dinner',
            category: 'Combo Item'
          });
        }
      }
    });
    setSelectedMenus(newItems);
  };

  const handleRemoveCombo = (combo) => {
    setSelectedCombos(selectedCombos.filter(c => c.name !== combo.name));
    let newItems = [...selectedMenus];
    (combo.items || []).forEach(dishName => {
      newItems = newItems.filter(m => m.name.toLowerCase() !== dishName.toLowerCase());
    });
    setSelectedMenus(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !email) {
      toast.error('Client Name, Phone Number, and Email Address are required.');
      return;
    }

    setSaving(true);
    // Combine all dish selections (combos, menu, and meal-specific dishes)
    const allSelectedMenus = [
      ...selectedMenus,
      ...selectedBreakfast,
      ...selectedLunch,
      ...selectedDinner
    ];
    const payload = {
      name,
      phone,
      email,
      address,
      eventType,
      eventDate,
      guestCount,
      notes,
      menuItems: (serviceType === 'Catering' || serviceType === 'Both') ? allSelectedMenus : [],
      vegetables: (serviceType === 'Catering' || serviceType === 'Both') ? selectedVeg : [],
      groceries: (serviceType === 'Catering' || serviceType === 'Both') ? selectedGroc : [],
      totalAmount,
      discount,
      paidAmount,
      paymentStatus,
      serviceType,
      rentedVessels,
      eventName
    };

    try {
      await axios.post('/api/v1/customers', payload);
      toast.success('Customer registered successfully!');
      navigate('/customers');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to register customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          New Customer Registration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Add new client records, choose catering vs vessel rental services, and calculate billing payments.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-premium shadow-premium overflow-hidden">
        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* SECTION 1: Basic & Event Details */}
          <div className="space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <User size={18} className="text-primary" />
                Client & Event Details
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Service Type Selection */}
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Service Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType('Catering');
                      if (eventType === 'Vessel Rental') setEventType('Wedding');
                    }}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase transition-all border ${
                      serviceType === 'Catering'
                        ? 'bg-primary border-primary text-white shadow-premium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-550'
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
                    className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase transition-all border ${
                      serviceType === 'Vessel Only'
                        ? 'bg-secondary border-secondary text-white shadow-premium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-550'
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
                    className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-bold uppercase transition-all border ${
                      serviceType === 'Both'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-premium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-550'
                    }`}
                  >
                    Both Services
                  </button>
                </div>
              </div>

              {/* Row 1 inputs */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Client Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 86828 41582"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              {/* Row 2 inputs */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="E.g., Anitha's Wedding Reception"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Event Type</label>
                {serviceType === 'Vessel Only' ? (
                  <input
                    type="text"
                    readOnly
                    value="Vessel Rental"
                    className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-base font-bold text-slate-700 dark:text-slate-300"
                  />
                ) : (
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Corporate">Corporate Meeting</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Engagement">Engagement</option>
                    <option value="General">General Party</option>
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Guests</label>
                <input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                  placeholder="50"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Row 3 inputs */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Delivery Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full street location details..."
                  rows="3"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 resize-none placeholder-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, visual decorations, menu remarks..."
                  rows="3"
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 resize-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Billing & Payment Details */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5 pt-4">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={18} className="text-emerald-500" />
                Billing & Payment Details
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Paid Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-900/40 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Balance Amount (₹)</label>
                <input
                  type="number"
                  readOnly
                  value={totalAmount - discount - paidAmount}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-base text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 dark:text-slate-100 font-bold"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Event Requirements (Food/Catering only) */}
          {(serviceType === 'Catering' || serviceType === 'Both') && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={18} className="text-secondary" />
                  Event Requirements
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Menu Section */}
                <div className="space-y-4">
                  <SearchSelect
                    label="1. Search & Select Combo Offer"
                    placeholder="Select combo packages (retrieves all dishes)..."
                    query={comboSearch}
                    setQuery={setComboSearch}
                    suggestions={allCombos}
                    selectedItems={selectedCombos}
                    onAdd={handleAddCombo}
                    onRemove={handleRemoveCombo}
                    hideTags={true}
                  />

                  <SearchSelect
                    label="2. Search & Add Individual Dishes"
                    placeholder="Filter standard dishes or type to add custom ones..."
                    query={menuSearch}
                    setQuery={setMenuSearch}
                    suggestions={allMenuItems}
                    selectedItems={selectedMenus}
                    onAdd={(item) => {
                      if (!selectedMenus.some(m => m.name === item.name)) {
                        setSelectedMenus([...selectedMenus, item]);
                      }
                    }}
                    onRemove={(item) => setSelectedMenus(selectedMenus.filter(m => m.name !== item.name))}
                    hideTags={true}
                    allowCustom={true}
                  />

                  {/* Combos Visual tags */}
                  {selectedCombos.length > 0 && (
                    <div className="space-y-2 mt-3 p-3 bg-indigo-50/50 dark:bg-slate-800/30 rounded-xl border border-indigo-100/50 dark:border-slate-800 text-xs">
                      <span className="font-bold text-indigo-500 uppercase tracking-wider block">Selected Combos:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCombos.map(combo => (
                          <span key={combo.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-semibold rounded-lg">
                            🎁 {combo.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveCombo(combo)}
                              className="text-indigo-500 hover:text-indigo-700 font-extrabold text-base ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Menu Items tags */}
                  <div className="space-y-2 mt-4 p-3 bg-emerald-50/40 dark:bg-slate-800/30 rounded-xl border border-emerald-100/50 dark:border-slate-800 text-xs">
                    <span className="font-bold text-emerald-600 uppercase tracking-wider block">Dishes in Menu ({selectedMenus.length}):</span>
                    {selectedMenus.length === 0 ? (
                      <span className="text-slate-400 block italic">No menu items selected.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMenus.map(item => (
                          <span key={item.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold rounded-lg">
                            🍽️ {item.name}
                            <button
                              type="button"
                              onClick={() => setSelectedMenus(selectedMenus.filter(m => m.name !== item.name))}
                              className="text-emerald-500 hover:text-danger font-extrabold text-base ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              {/* Breakfast Dishes */}
              <div className="space-y-2 mt-4">
                <SearchSelect
                  label="Breakfast Dishes"
                  placeholder="Search breakfast dishes..."
                  query={breakfastSearch}
                  setQuery={setBreakfastSearch}
                  suggestions={allMenuItems.filter(item => item.course === 'breakfast')}
                  selectedItems={selectedBreakfast}
                  onAdd={(item) => {
                    if (!selectedBreakfast.some(b => b.name === item.name)) {
                      setSelectedBreakfast([...selectedBreakfast, item]);
                    }
                  }}
                  onRemove={(item) => setSelectedBreakfast(selectedBreakfast.filter(b => b.name !== item.name))}
                  hideTags={false}
                  allowCustom={true}
                />
              </div>
              {/* Lunch Dishes */}
              <div className="space-y-2 mt-4">
                <SearchSelect
                  label="Lunch Dishes"
                  placeholder="Search lunch dishes..."
                  query={lunchSearch}
                  setQuery={setLunchSearch}
                  suggestions={allMenuItems.filter(item => item.course === 'lunch')}
                  selectedItems={selectedLunch}
                  onAdd={(item) => {
                    if (!selectedLunch.some(l => l.name === item.name)) {
                      setSelectedLunch([...selectedLunch, item]);
                    }
                  }}
                  onRemove={(item) => setSelectedLunch(selectedLunch.filter(l => l.name !== item.name))}
                  hideTags={false}
                  allowCustom={true}
                />
              </div>
              {/* Dinner Dishes */}
              <div className="space-y-2 mt-4">
                <SearchSelect
                  label="Dinner Dishes"
                  placeholder="Search dinner dishes..."
                  query={dinnerSearch}
                  setQuery={setDinnerSearch}
                  suggestions={allMenuItems.filter(item => item.course === 'dinner')}
                  selectedItems={selectedDinner}
                  onAdd={(item) => {
                    if (!selectedDinner.some(d => d.name === item.name)) {
                      setSelectedDinner([...selectedDinner, item]);
                    }
                  }}
                  onRemove={(item) => setSelectedDinner(selectedDinner.filter(d => d.name !== item.name))}
                  hideTags={false}
                  allowCustom={true}
                />
              </div>

                {/* Vegetables Section */}
                <div className="space-y-3">
                  <SearchSelect
                    label="Vegetables Selection"
                    placeholder="Search and add required vegetables..."
                    query={vegSearch}
                    setQuery={setVegSearch}
                    suggestions={allVegetableItems}
                    selectedItems={selectedVeg}
                    onAdd={(item) => {
                      if (!selectedVeg.some(v => v.name === item.name)) {
                        setSelectedVeg([...selectedVeg, { name: item.name, qty: 1, unit: 'kg' }]);
                      }
                    }}
                    onRemove={(item) => setSelectedVeg(selectedVeg.filter(v => v.name !== item.name))}
                    hideTags={true}
                  />

                  {selectedVeg.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs">
                      {selectedVeg.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold">{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                const updated = [...selectedVeg];
                                updated[idx].qty = val;
                                setSelectedVeg(updated);
                              }}
                              className="w-14 p-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => {
                                const updated = [...selectedVeg];
                                updated[idx].unit = e.target.value;
                                setSelectedVeg(updated);
                              }}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                            >
                              <option value="kg">kg</option>
                              <option value="g">gram</option>
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

                {/* Groceries Section */}
                <div className="space-y-3">
                  <SearchSelect
                    label="Groceries Selection"
                    placeholder="Search and add required grocery items..."
                    query={grocSearch}
                    setQuery={setGrocSearch}
                    suggestions={allGroceryItems}
                    selectedItems={selectedGroc}
                    onAdd={(item) => {
                      if (!selectedGroc.some(g => g.name === item.name)) {
                        setSelectedGroc([...selectedGroc, { name: item.name, qty: 1, unit: item.unit || 'kg' }]);
                      }
                    }}
                    onRemove={(item) => setSelectedGroc(selectedGroc.filter(g => g.name !== item.name))}
                    hideTags={true}
                  />

                  {selectedGroc.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs">
                      {selectedGroc.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold">{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                const updated = [...selectedGroc];
                                updated[idx].qty = val;
                                setSelectedGroc(updated);
                              }}
                              className="w-14 p-1 text-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => {
                                const updated = [...selectedGroc];
                                updated[idx].unit = e.target.value;
                                setSelectedGroc(updated);
                              }}
                              className="p-1 rounded border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-955"
                            >
                              <option value="kg">kg</option>
                              <option value="g">gram</option>
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
            </div>
          )}

          {/* SECTION: Vessel Rental Requirements (shown for both Catering & Vessel Only) */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={18} className="text-primary" />
                Vessel Rental Requirements
              </h3>
            </div>

            {/* Select and Add Vessel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Select Vessel</label>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Choose Vessel Asset --</option>
                  {allVessels.map(v => (
                    <option key={v._id} value={v._id} disabled={v.availableQty <= 0}>
                      {v.name} ({v.size}) - {v.availableQty} available
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase">Rent Qty</label>
                <input
                  type="number"
                  min="1"
                  value={rentQty}
                  onChange={(e) => setRentQty(parseInt(e.target.value) || 1)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase">Rent (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase">Deposit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={rentDeposit}
                  onChange={(e) => setRentDeposit(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase">Return Date</label>
                <input
                  type="date"
                  value={vesselReturnDate}
                  onChange={(e) => setVesselReturnDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={handleAddVessel}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-all focus:outline-none"
                >
                  Add Vessel to Rental Agreement
                </button>
              </div>
            </div>

            {/* Selected Vessels Table */}
            {rentedVessels.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Vessel Name</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Rent / Unit</th>
                      <th className="p-3">Deposit / Unit</th>
                      <th className="p-3">Return Date</th>
                      <th className="p-3">Total Cost</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentedVessels.map((rv, idx) => {
                      const totalRent = rv.qty * rv.rentAmount;
                      const totalDeposit = rv.qty * rv.deposit;
                      return (
                        <tr key={idx} className="border-b border-slate-150 dark:border-slate-800 last:border-b-0">
                          <td className="p-3 font-semibold">{rv.vesselName}</td>
                          <td className="p-3"><span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] uppercase">{rv.size}</span></td>
                          <td className="p-3 font-bold">{rv.qty}</td>
                          <td className="p-3">₹{rv.rentAmount}</td>
                          <td className="p-3">₹{rv.deposit}</td>
                          <td className="p-3">{rv.returnDate}</td>
                          <td className="p-3 font-bold text-primary">₹{(totalRent + totalDeposit).toFixed(2)} <span className="text-[9px] font-normal text-slate-400 block">(Rent: ₹{totalRent} + Dep: ₹{totalDeposit})</span></td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveVessel(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded flex items-center gap-1 ml-auto"
                            >
                              <Trash size={12} />
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

          {/* Submit Actions (Yellow Save Button like the 1st Image) */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-[#ffd014] hover:bg-[#ebd014] text-slate-900 text-sm font-extrabold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 focus:outline-none uppercase tracking-wider animate-pulse"
            >
              {saving ? 'Registering...' : 'Register Customer'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
