import React, { useState, useEffect } from 'react';


import { Search, Plus, Edit, Trash } from 'lucide-react';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Groceries() {
  // Handler to move focus on ArrowRight key
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      const form = e.target.form;
      if (form) {
        const elements = Array.from(form.elements);
        const idx = elements.indexOf(e.target);
        const next = elements[idx + 1];
        if (next) {
          next.focus();
          e.preventDefault();
        }
      }
    }
  };

  const [groceries, setGroceries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');

  const fetchGroceries = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/groceries');
      let data = res.data.data || [];
      
      // Filter out vegetables from general groceries
      data = data.filter(g => g.category !== 'Vegetables');
      
      if (search) {
        data = data.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
      }
      setGroceries(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load groceries database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroceries();
  }, [search]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setName('');
    setUnit('kg');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setUnit(item.unit);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { 
      name, 
      category: editingItem ? editingItem.category : 'Groceries', 
      stock: editingItem ? editingItem.stock : 0, 
      unit, 
      unitCost: editingItem ? editingItem.unitCost : 0, 
      lowStockThreshold: editingItem ? editingItem.lowStockThreshold : 0 
    };
    try {
      if (editingItem) {
        await axios.put(`/api/v1/groceries/${editingItem._id}`, payload);
        toast.success('Ingredient profile updated!');
      } else {
        await axios.post('/api/v1/groceries', payload);
        toast.success('New ingredient added to registry!');
      }
      setIsModalOpen(false);
      fetchGroceries();
    } catch (err) {
      toast.error('Failed to save inventory item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item from registry?')) return;
    try {
      await axios.delete(`/api/v1/groceries/${id}`);
      toast.success('Item deleted.');
      fetchGroceries();
    } catch (err) {
      toast.error('Failed to delete item.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Grocery Inventory & Raw Materials
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage ingredients and cooking supplies in the master catalog registry
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 focus:outline-none transition-all duration-200"
        >
          <Plus size={16} />
          Add Ingredient
        </button>
      </div>

      {/* Toolbar filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1 max-w-lg">
          <div className="relative flex-1 flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredient by name..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-sm focus:border-primary transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Database Listing Card */}
      <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                <th className="py-3 px-2 w-[70%]">Ingredient Name</th>
                <th className="py-3 px-2">Unit</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400 shimmer-loading rounded-xl">
                    Loading grocery registry...
                  </td>
                </tr>
              ) : groceries.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400">
                    No grocery items found in registry.
                  </td>
                </tr>
              ) : (
                groceries.map((item) => (
                  <tr 
                    key={item._id}
                    className="border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-100">{item.name}</td>
                    <td className="py-3 px-2 font-bold text-slate-600 dark:text-slate-400 capitalize">
                      {item.unit}
                    </td>
                    <td className="py-3 px-2 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-all duration-150"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
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

      {/* Creation / Update Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Ingredient' : 'Register Ingredient'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Ingredient Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Type</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="kg">kg (Kilogram)</option>
              <option value="ltr">ltr (Liter)</option>
              <option value="packet">packet</option>
              <option value="pcs">pcs (Pieces)</option>
              <option value="box">box</option>
              <option value="bundle">bundle</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingItem ? 'Save Item Changes' : 'Register Ingredient'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

