import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash, Edit, CheckCircle, HelpCircle, Trophy, RotateCcw, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Vessels() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [vessels, setVessels] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rentalLoading, setRentalLoading] = useState(false);

  // Vessels Modals
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState(null);
  const [vesselName, setVesselName] = useState('');
  const [totalQty, setTotalQty] = useState(0);
  const [vesselSize, setVesselSize] = useState('Medium');
  const [vesselDesc, setVesselDesc] = useState('');

  // Assign Rentals Modals
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [selectedVesselId, setSelectedVesselId] = useState('');
  const [renterName, setRenterName] = useState('');
  const [renterPhone, setRenterPhone] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [rentQty, setRentQty] = useState(1);
  const [rentAmount, setRentAmount] = useState(0);
  const [deposit, setDeposit] = useState(0);

  // Return Rental modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningRentalId, setReturningRentalId] = useState(null);
  const [returnStatus, setReturnStatus] = useState('Returned'); // Returned | Damaged
  const [rentalPaidAmount, setRentalPaidAmount] = useState(0);
  const [returnNotes, setReturnNotes] = useState('');

  const fetchVesselsAndRentals = async () => {
    setLoading(true);
    try {
      const [vesRes, rentRes] = await Promise.all([
        axios.get('/api/v1/vessels'),
        axios.get('/api/v1/rentals')
      ]);
      setVessels(vesRes.data.data || []);
      setRentals(rentRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vessel assets database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVesselsAndRentals();
  }, []);

  const handleOpenVesselCreate = () => {
    setEditingVessel(null);
    setVesselName('');
    setTotalQty(10);
    setVesselSize('Medium');
    setVesselDesc('');
    setIsVesselModalOpen(true);
  };

  const handleOpenVesselEdit = (v) => {
    setEditingVessel(v);
    setVesselName(v.name);
    setTotalQty(v.totalQty);
    setVesselSize(v.size);
    setVesselDesc(v.description || '');
    setIsVesselModalOpen(true);
  };

  const handleSubmitVessel = async (e) => {
    e.preventDefault();
    const payload = { name: vesselName, totalQty, size: vesselSize, description: vesselDesc };
    try {
      if (editingVessel) {
        await axios.put(`/api/v1/vessels/${editingVessel._id}`, payload);
        toast.success('Vessel specifications updated!');
      } else {
        await axios.post('/api/v1/vessels', payload);
        toast.success('Vessel item added to inventory!');
      }
      setIsVesselModalOpen(false);
      fetchVesselsAndRentals();
    } catch (err) {
      toast.error('Failed to save vessel details.');
    }
  };

  const handleDeleteVessel = async (id) => {
    if (!window.confirm('Delete this vessel from database?')) return;
    try {
      await axios.delete(`/api/v1/vessels/${id}`);
      toast.success('Asset deleted.');
      fetchVesselsAndRentals();
    } catch (err) {
      toast.error('Failed to delete asset.');
    }
  };

  const handleOpenRentModal = (vessel) => {
    setSelectedVesselId(vessel._id);
    setRenterName('');
    setRenterPhone('');
    setAssignedDate(new Date().toISOString().split('T')[0]);
    
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    setReturnDate(weekLater.toISOString().split('T')[0]);
    
    setRentQty(1);
    setRentAmount(50);
    setDeposit(50);
    setIsRentalModalOpen(true);
  };

  const handleSubmitRental = async (e) => {
    e.preventDefault();
    const payload = {
      vesselId: selectedVesselId,
      renterName,
      phone: renterPhone,
      assignedDate,
      returnDate,
      qty: rentQty,
      rentAmount,
      deposit
    };

    try {
      await axios.post('/api/v1/rentals', payload);
      toast.success('Vessels rented and stock counts locked.');
      setIsRentalModalOpen(false);
      fetchVesselsAndRentals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing rental.');
    }
  };

  const handleOpenReturnModal = (rental) => {
    setReturningRentalId(rental._id);
    setReturnStatus('Returned');
    setRentalPaidAmount(rental.rentAmount);
    setReturnNotes('');
    setIsReturnModalOpen(true);
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/v1/rentals/${returningRentalId}/return`, {
        status: returnStatus,
        paidAmount: rentalPaidAmount,
        notes: returnNotes
      });
      toast.success(`Rental returns registered successfully!`);
      setIsReturnModalOpen(false);
      fetchVesselsAndRentals();
    } catch (err) {
      toast.error('Failed to return assets.');
    }
  };

  const handleDeleteRental = async (id) => {
    if (!window.confirm('Delete this rental entry?')) return;
    try {
      await axios.delete(`/api/v1/rentals/${id}`);
      toast.success('Rental records purged.');
      fetchVesselsAndRentals();
    } catch (err) {
      toast.error('Could not delete rental.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Catering Vessels & Equipment Renting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track Stainless Pots, Chafing Dishes, Dispenser Jugs, and equipment rental agreements
          </p>
        </div>
        <button
          onClick={handleOpenVesselCreate}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 focus:outline-none transition-all duration-200"
        >
          <Plus size={16} />
          Add Vessel
        </button>
      </div>

      {/* Grid: Left is Vessels Catalog, Right is Rentals agreements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Vessels Inventory Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <span>Equipment Stock & Availability</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vessels.map((v) => (
              <div 
                key={v._id}
                className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{v.name}</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[8px] font-bold uppercase">{v.size}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{v.description || 'No Description logged.'}</p>

                  <div className="grid grid-cols-3 gap-2 text-center mt-4 text-[10px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <div>
                      <span className="text-slate-400">Total</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{v.totalQty}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Rented</span>
                      <p className="font-bold text-danger text-xs mt-0.5">{v.rentedQty}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Available</span>
                      <p className="font-bold text-success text-xs mt-0.5">{v.availableQty}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
                  <button
                    onClick={() => handleOpenRentModal(v)}
                    disabled={v.availableQty === 0}
                    className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg transition-colors focus:outline-none disabled:opacity-50"
                  >
                    Assign Rental
                  </button>
                  <button onClick={() => handleOpenVesselEdit(v)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-lg"><Edit size={12} /></button>
                  <button onClick={() => handleDeleteVessel(v._id)} className="p-1.5 hover:bg-danger/10 text-slate-400 hover:text-danger rounded-lg"><Trash size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active rentals list */}
        <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-4">
          <h3 className="font-bold text-sm">Active Rental Agreements</h3>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {rentals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No vessel rentals recorded.</div>
            ) : (
              rentals.map((r) => {
                const isOverdue = new Date(r.returnDate) < new Date() && r.status === 'Rented';
                return (
                  <div 
                    key={r._id}
                    className={`p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border flex flex-col justify-between text-xs gap-3 ${
                      isOverdue ? 'border-danger/40 bg-danger/5' : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{r.vesselName} ({r.qty}x)</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          r.status === 'Returned' 
                            ? 'bg-success/15 text-success' 
                            : r.status === 'Damaged' 
                              ? 'bg-danger/15 text-danger' 
                              : 'bg-primary/10 text-primary'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Renter: {r.renterName} ({r.phone})</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Due date: {r.returnDate}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px]">
                      <span className="font-bold text-slate-500">Rent Balance: {currencySymbol}{r.balanceAmount.toFixed(0)}</span>
                      {r.status === 'Rented' ? (
                        <button
                          onClick={() => handleOpenReturnModal(r)}
                          className="px-2.5 py-1 bg-secondary hover:bg-secondary-hover text-white text-[9px] font-extrabold rounded-md focus:outline-none transition-colors flex items-center gap-1"
                        >
                          <RotateCcw size={10} />
                          Return
                        </button>
                      ) : (
                        <button onClick={() => handleDeleteRental(r._id)} className="p-1 hover:bg-danger/10 rounded text-slate-400 hover:text-danger"><Trash size={12} /></button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Vessel Modal Form */}
      <Modal
        isOpen={isVesselModalOpen}
        onClose={() => setIsVesselModalOpen(false)}
        title={editingVessel ? 'Modify Vessel details' : 'Register Catering Asset'}
      >
        <form onSubmit={handleSubmitVessel} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Vessel / Asset Name</label>
            <input
              type="text"
              required
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              placeholder="e.g. Stainless Steel Biryani Pot"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Asset Size</label>
              <select
                value={vesselSize}
                onChange={(e) => setVesselSize(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="Small">Small (Cups / Trays)</option>
                <option value="Medium">Medium (Serving Bowls)</option>
                <option value="Large">Large (Bulk Cook Pots)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory Count</label>
              <input
                type="number"
                required
                value={totalQty}
                onChange={(e) => setTotalQty(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Asset Description</label>
            <textarea
              value={vesselDesc}
              onChange={(e) => setVesselDesc(e.target.value)}
              placeholder="e.g. 50-Liter cooking capacity with dual handle loops."
              rows="2"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingVessel ? 'Save Asset Changes' : 'Register Equipment'}
          </button>
        </form>
      </Modal>

      {/* Assign Rental Modal Form */}
      <Modal
        isOpen={isRentalModalOpen}
        onClose={() => setIsRentalModalOpen(false)}
        title="Rent Out Equipment"
      >
        <form onSubmit={handleSubmitRental} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Renter / Vendor Name</label>
            <input
              type="text"
              required
              value={renterName}
              onChange={(e) => setRenterName(e.target.value)}
              placeholder="e.g. Grand Plaza Hotel"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</label>
              <input
                type="tel"
                value={renterPhone}
                onChange={(e) => setRenterPhone(e.target.value)}
                placeholder="555-1020"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Quantity to Rent</label>
              <input
                type="number"
                min="1"
                required
                value={rentQty}
                onChange={(e) => setRentQty(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Date</label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Return Due Date</label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Rent Amount ({currencySymbol})</label>
              <input
                type="number"
                required
                value={rentAmount}
                onChange={(e) => setRentAmount(parseFloat(e.target.value) || 0)}
                placeholder="100"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-primary font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Sec. Deposit Deposit ({currencySymbol})</label>
              <input
                type="number"
                required
                value={deposit}
                onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                placeholder="50"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-secondary font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            Disburse Rental Agreement
          </button>
        </form>
      </Modal>

      {/* Return Rental Modal Form */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Resolve Equipment Rental Return"
      >
        <form onSubmit={handleSubmitReturn} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Return Status</label>
              <select
                value={returnStatus}
                onChange={(e) => setReturnStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="Returned">Returned (Fully Intact)</option>
                <option value="Damaged">Damaged (Reduce Stock)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Rent Payout Received ({currencySymbol})</label>
              <input
                type="number"
                required
                value={rentalPaidAmount}
                onChange={(e) => setRentalPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-success"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution Memo / Notes</label>
            <textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="e.g. Returned clean. Refunded deposit in cash."
              rows="3"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            Finalize Payout & Return Stock
          </button>
        </form>
      </Modal>
    </div>
  );
}
