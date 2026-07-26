import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash, Download, Send, Eye, FileText, ChevronRight, Calculator } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Invoices() {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';

  const [invoices, setInvoices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventId, setEventId] = useState('');
  const [date, setDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);

  // Flexible invoice options states
  const [optSingleCatering, setOptSingleCatering] = useState(true);
  const [optIncludeVessels, setOptIncludeVessels] = useState(true);
  const [optIncludeLabour, setOptIncludeLabour] = useState(true);
  const [fetchedEventData, setFetchedEventData] = useState(null);

  // Sharing states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const [invRes, eventRes] = await Promise.all([
        axios.get('/api/v1/invoices'),
        axios.get('/api/v1/events')
      ]);
      setInvoices(invRes.data.data || []);
      setEvents(eventRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoice logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoiceDetails = async (id) => {
    try {
      const res = await axios.get(`/api/v1/invoices/${id}`);
      setSelectedInvoice(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceDetails(selectedInvoiceId);
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedInvoiceId]);

  const rebuildInvoiceItems = (data, singleCatering, includeVessels, includeLabour) => {
    if (!data) return;
    const { event, customer, eventLabour } = data;
    const invoiceItems = [];

    // 1. Catering
    if (customer && (customer.serviceType === 'Catering' || customer.serviceType === 'Both')) {
      if (singleCatering) {
        invoiceItems.push({
          description: `${customer.eventType || 'General'} Catering Service Package (${customer.guestCount || 0} Guests)`,
          quantity: 1,
          rate: customer.totalAmount || 0
        });
      } else {
        if (Array.isArray(customer.menuItems) && customer.menuItems.length > 0) {
          customer.menuItems.forEach(m => {
            invoiceItems.push({
              description: `${m.name} (Catering Service)`,
              quantity: customer.guestCount || 50,
              rate: parseFloat(m.unitCost) || 0
            });
          });
        }
      }
    }

    // 2. Vessels
    if (customer && (customer.serviceType === 'Vessel Only' || customer.serviceType === 'Both')) {
      if (includeVessels && Array.isArray(customer.rentedVessels) && customer.rentedVessels.length > 0) {
        customer.rentedVessels.forEach(v => {
          invoiceItems.push({
            description: `Vessel Rental: ${v.vesselName}`,
            quantity: parseInt(v.qty) || 1,
            rate: parseFloat(v.rentAmount) || 0
          });
        });
      }
    }

    // 3. Labour
    if (includeLabour && eventLabour && Array.isArray(eventLabour.workers) && eventLabour.workers.length > 0) {
      eventLabour.workers.forEach(w => {
        invoiceItems.push({
          description: `Labour Charge: ${w.name} (${w.daysWorked} days worked)`,
          quantity: 1,
          rate: parseFloat(w.totalSalary) || 0
        });
      });
    }

    // Fallback if empty
    if (invoiceItems.length === 0 && customer) {
      invoiceItems.push({
        description: `${customer.eventType || 'General'} Services`,
        quantity: 1,
        rate: customer.totalAmount || 0
      });
    }

    setItems(invoiceItems);
  };

  useEffect(() => {
    if (!eventId) {
      setFetchedEventData(null);
      return;
    }
    const loadEventData = async () => {
      try {
        const event = events.find(ev => ev._id === eventId);
        if (!event) return;

        let customer = null;
        if (event.customerId) {
          const custRes = await axios.get(`/api/v1/customers/${event.customerId}`);
          customer = custRes.data.data;
        }

        const labourRes = await axios.get(`/api/v1/event-labour?eventId=${eventId}`);
        const eventLabour = labourRes.data.data?.[0] || null;

        const data = { event, customer, eventLabour };
        setFetchedEventData(data);

        if (customer) {
          setCustomerName(customer.name || '');
          setCustomerEmail(customer.email || '');
        }

        rebuildInvoiceItems(data, optSingleCatering, optIncludeVessels, optIncludeLabour);
      } catch (err) {
        console.error('Failed to load linked event details:', err);
        toast.error('Failed to retrieve event details.');
      }
    };
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (fetchedEventData) {
      rebuildInvoiceItems(fetchedEventData, optSingleCatering, optIncludeVessels, optIncludeLabour);
    }
  }, [optSingleCatering, optIncludeVessels, optIncludeLabour]);

  const handleOpenCreateModal = () => {
    setCustomerName('');
    setCustomerEmail('');
    setEventId('');
    setDate(new Date().toISOString().split('T')[0]);
    setDiscount(0);
    setTax(0);
    setItems([{ description: 'Catering Buffet Services', quantity: 100, rate: 15 }]);
    setOptSingleCatering(true);
    setOptIncludeVessels(true);
    setOptIncludeLabour(true);
    setFetchedEventData(null);
    setIsModalOpen(true);
  };

  const handleAddRow = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  };

  const handleRemoveRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    setItems(items.map((item, i) => 
      i === idx ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      customerName,
      customerEmail,
      eventId,
      date,
      items: items.map(it => ({
        description: it.description,
        quantity: parseInt(it.quantity) || 1,
        rate: parseFloat(it.rate) || 0
      })),
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0
    };

    try {
      await axios.post('/api/v1/invoices', payload);
      toast.success('Invoice generated and posted.');
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to create invoice.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice permanent?')) return;
    try {
      await axios.delete(`/api/v1/invoices/${id}`);
      toast.success('Invoice purged.');
      if (selectedInvoiceId === id) setSelectedInvoiceId(null);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  // Triggers backend streaming download PDF
  const handleDownloadPDF = async (id, invNum) => {
    try {
      toast.loading('Preparing Invoice PDF...', { id: 'pdf-toast' });
      const res = await axios.get(`/api/v1/invoices/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invNum || 'Document'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF Downloaded successfully!', { id: 'pdf-toast' });
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF.', { id: 'pdf-toast' });
    }
  };

  const handleOpenShareModal = (inv) => {
    setSelectedInvoice(inv);
    setShareEmail(inv.customerEmail || '');
    setIsShareModalOpen(true);
  };

  const handleSendEmailShare = async (e) => {
    e.preventDefault();
    try {
      toast.loading('Mailing PDF attachment...', { id: 'mail' });
      const res = await axios.post(`/api/v1/invoices/${selectedInvoice._id}/share`, { emailTo: shareEmail });
      toast.dismiss('mail');
      if (res.data.success) {
        toast.success('Invoice emailed successfully!');
        if (res.data.previewUrl) {
          console.log('📬 Sent check link:', res.data.previewUrl);
        }
        setIsShareModalOpen(false);
      }
    } catch (err) {
      toast.dismiss('mail');
      toast.error('Could not deliver email.');
    }
  };

  const calculateGrandTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    return Math.max(0, subtotal - parseFloat(discount || 0) + parseFloat(tax || 0));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Billing & Invoices Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create professional billing invoices and dispatch copies directly to clients
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 focus:outline-none transition-all duration-200"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Invoice list */}
        <div className={`p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium ${selectedInvoiceId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-2">Invoice #</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2 text-right">Total</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 shimmer-loading rounded-xl">
                      Opening invoice portfolios...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No invoices issued yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv._id}
                      onClick={() => setSelectedInvoiceId(inv._id)}
                      className={`border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors ${selectedInvoiceId === inv._id ? 'bg-primary/5 dark:bg-slate-800/60 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-2 font-bold text-primary dark:text-secondary">{inv.invoiceNumber}</td>
                      <td className="py-3 px-2">{inv.customerName}</td>
                      <td className="py-3 px-2 text-slate-500">{inv.date}</td>
                      <td className="py-3 px-2 text-right font-semibold">{currencySymbol}{inv.total.toFixed(2)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          inv.status === 'Paid' 
                            ? 'bg-success/10 text-success' 
                            : inv.status === 'Partial' 
                              ? 'bg-warning/10 text-warning' 
                              : 'bg-danger/10 text-danger'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right space-x-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"><Download size={14} /></button>
                        <button onClick={() => handleOpenShareModal(inv)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary"><Send size={14} /></button>
                        <button onClick={() => handleDelete(inv._id)} className="p-1.5 hover:bg-danger/10 rounded-lg text-slate-400 hover:text-danger"><Trash size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable styled invoice preview */}
        {selectedInvoiceId && selectedInvoice && (
          <div className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-6 relative xl:col-span-1">
            <button 
              onClick={() => setSelectedInvoiceId(null)}
              className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Close Preview
            </button>

            {/* Document Frame */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-[10px] space-y-4 font-sans text-slate-700 dark:text-slate-300">
              <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-primary">INVOICE</h4>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedInvoice.invoiceNumber}</p>
                  <p className="text-slate-400 text-[9px] mt-0.5">Date: {selectedInvoice.date}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    selectedInvoice.status === 'Paid' ? 'bg-success/15 text-success' : 'bg-danger/10 text-danger'
                  }`}>{selectedInvoice.status}</span>
                </div>
              </div>

              {/* Client info */}
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase">Bill To:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.customerName}</p>
                <p>{selectedInvoice.customerEmail || 'No Email Logged'}</p>
              </div>

              {/* Table items */}
              <div className="space-y-2">
                <div className="grid grid-cols-5 font-bold border-b border-slate-200/50 dark:border-slate-800 pb-1 text-slate-400">
                  <span className="col-span-3">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>
                {selectedInvoice.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-5 border-b border-slate-100 dark:border-slate-800/50 pb-1">
                    <span className="col-span-3 font-semibold truncate text-slate-800 dark:text-slate-200">{it.description}</span>
                    <span className="text-center">{it.quantity}</span>
                    <span className="text-right">{currencySymbol}{it.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Finance calculations */}
              <div className="space-y-1 text-right pt-2 border-t border-slate-200/50 dark:border-slate-800 font-medium">
                <p>Subtotal: {currencySymbol}{selectedInvoice.subtotal.toFixed(2)}</p>
                <p className="text-success">Discount: -{currencySymbol}{(selectedInvoice.discount || 0).toFixed(2)}</p>
                <p>GST Tax: {currencySymbol}{(selectedInvoice.tax || 0).toFixed(2)}</p>
                <p className="text-sm font-extrabold text-primary mt-1">Grand Total: {currencySymbol}{selectedInvoice.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice._id, selectedInvoice.invoiceNumber)}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium focus:outline-none transition-colors flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Customer Billing Invoice"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Linked Event ID</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                <option value="">-- No Linked Event --</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name} ({ev.date})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          {eventId && fetchedEventData && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 border border-slate-150 dark:border-slate-800 text-xs">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block tracking-wider">Invoice Options</span>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-4 font-bold text-slate-700 dark:text-slate-350">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={optSingleCatering}
                    onChange={(e) => setOptSingleCatering(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>Single Catering Sum</span>
                </label>
                {fetchedEventData.customer?.rentedVessels?.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optIncludeVessels}
                      onChange={(e) => setOptIncludeVessels(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                    <span>Include Vessels</span>
                  </label>
                )}
                {fetchedEventData.eventLabour?.workers?.length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={optIncludeLabour}
                      onChange={(e) => setOptIncludeLabour(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                    <span>Include Labour</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC ITEM ROWS */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Billable Line Items</label>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-14 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    placeholder="Rate"
                    className="w-16 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-right text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Special Discount ({currencySymbol})</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Taxes (GST/Service) ({currencySymbol})</label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Live Grand Total:</span>
            <span className="font-bold text-primary text-base">{currencySymbol}{calculateGrandTotal().toFixed(2)}</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            Post Invoice Details
          </button>
        </form>
      </Modal>

      {/* Share invoice Modal Dialog */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Invoice by Email"
      >
        <form onSubmit={handleSendEmailShare} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Recipient Email</label>
            <input
              type="email"
              required
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="client@gmail.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium transition-all duration-200 focus:outline-none"
          >
            Send Email
          </button>
        </form>
      </Modal>
    </div>
  );
}
