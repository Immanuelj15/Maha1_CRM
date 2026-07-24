import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash, Flame, ChevronDown, ChevronUp, 
  Layers, Check, X, UtensilsCrossed, Sparkles 
} from 'lucide-react';
import axios from 'axios';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const COURSES = ['breakfast', 'lunch', 'dinner'];

export default function Menu() {
  const [activeTab, setActiveTab] = useState('dishes'); // 'dishes' | 'combos'
  const [menuItems, setMenuItems] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [combosLoading, setCombosLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Expanded accordion states for categories
  const [expandedCategories, setExpandedCategories] = useState({});

  // Dish Modal forms
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishCourse, setDishCourse] = useState('lunch');
  const [dishCategory, setDishCategory] = useState('');

  // Combo Modal forms
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboName, setComboName] = useState('');
  const [comboDescription, setComboDescription] = useState('');
  const [comboCourse, setComboCourse] = useState('dinner');
  const [comboCategory, setComboCategory] = useState('');
  const [comboItems, setComboItems] = useState([]);
  const [comboSearch, setComboSearch] = useState('');

  // Track expanded combos in view
  const [expandedCombos, setExpandedCombos] = useState({});

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/menu-items');
      setMenuItems(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load menu database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    setCombosLoading(true);
    try {
      const res = await axios.get('/api/v1/combos');
      setCombos(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load combo packages.');
    } finally {
      setCombosLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchCombos();
  }, []);

  // Filter and group items
  const getFilteredItems = () => {
    let items = [...menuItems];
    if (search) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (courseFilter) {
      items = items.filter(item => item.course === courseFilter);
    }
    return items;
  };

  const groupedItems = (() => {
    const items = getFilteredItems();
    const groups = {};
    items.forEach(item => {
      const cat = item.category || 'General/Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  })();

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const toggleComboExpand = (id) => {
    setExpandedCombos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Dish Operations
  const handleOpenCreateDish = () => {
    setEditingItem(null);
    setDishName('');
    setDishCourse('lunch');
    setDishCategory('');
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (item) => {
    setEditingItem(item);
    setDishName(item.name);
    setDishCourse(item.course);
    setDishCategory(item.category || '');
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    const payload = { 
      name: dishName, 
      unitCost: editingItem ? editingItem.unitCost : 0, // Preserve backend cost defaults
      course: dishCourse, 
      category: dishCategory.trim() || 'Others' 
    };
    try {
      if (editingItem) {
        await axios.put(`/api/v1/menu-items/${editingItem._id}`, payload);
        toast.success('Dish profile updated successfully!');
      } else {
        await axios.post('/api/v1/menu-items', payload);
        toast.success('New dish added to master menu catalog!');
      }
      setIsDishModalOpen(false);
      fetchMenuItems();
    } catch (err) {
      toast.error('Failed to save menu item.');
    }
  };

  const handleDeleteDish = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dish from the menu registry?')) return;
    try {
      await axios.delete(`/api/v1/menu-items/${id}`);
      toast.success('Dish removed from catalog.');
      fetchMenuItems();
    } catch (err) {
      toast.error('Failed to delete menu item.');
    }
  };

  // Combo Operations
  const handleOpenCreateCombo = () => {
    setEditingCombo(null);
    setComboName('');
    setComboDescription('');
    setComboCourse('dinner');
    setComboCategory('Combo');
    setComboItems([]);
    setComboSearch('');
    setIsComboModalOpen(true);
  };

  const handleOpenEditCombo = (combo) => {
    setEditingCombo(combo);
    setComboName(combo.name);
    setComboDescription(combo.description || '');
    setComboCourse(combo.course || 'dinner');
    setComboCategory(combo.category || 'Combo');
    setComboItems(combo.items || []);
    setComboSearch('');
    setIsComboModalOpen(true);
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!comboName || comboItems.length === 0) {
      toast.error('Please specify combo name and include at least 1 menu item.');
      return;
    }
    const payload = {
      name: comboName,
      description: comboDescription,
      course: comboCourse,
      category: comboCategory,
      items: comboItems
    };
    try {
      if (editingCombo) {
        await axios.put(`/api/v1/combos/${editingCombo._id}`, payload);
        toast.success('Combo template updated!');
      } else {
        await axios.post('/api/v1/combos', payload);
        toast.success('New session combo published successfully!');
      }
      setIsComboModalOpen(false);
      fetchCombos();
    } catch (err) {
      toast.error('Failed to save combo package.');
    }
  };

  const handleDeleteCombo = async (id) => {
    if (!window.confirm('Delete this combo template? This does not delete the dishes, only the package list.')) return;
    try {
      await axios.delete(`/api/v1/combos/${id}`);
      toast.success('Combo template removed.');
      fetchCombos();
    } catch (err) {
      toast.error('Failed to delete combo.');
    }
  };

  const handleAddDishToCombo = (dishName) => {
    if (comboItems.includes(dishName)) {
      toast.error('Item already included in combo.');
      return;
    }
    setComboItems(prev => [...prev, dishName]);
  };

  const handleRemoveDishFromCombo = (dishName) => {
    setComboItems(prev => prev.filter(name => name !== dishName));
  };

  // Collect unique category names for autocompletes
  const uniqueCategories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Catering Menu Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mahalakshmi A—Catering Service—Z master food list & combo configurations (Chef: M. Surya B.Sc)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'dishes' ? (
            <button
              onClick={handleOpenCreateDish}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 transition-all duration-200"
            >
              <Plus size={16} />
              Add Dish
            </button>
          ) : (
            <button
              onClick={handleOpenCreateCombo}
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium flex items-center gap-2 transition-all duration-200"
            >
              <Sparkles size={14} />
              New Combo Template
            </button>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('dishes')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'dishes'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Layers size={15} />
          Master Catalog ({menuItems.length} Recipes)
        </button>
        <button
          onClick={() => setActiveTab('combos')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'combos'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <UtensilsCrossed size={15} />
          Combo Templates ({combos.length})
        </button>
      </div>

      {/* TAB 1: MASTER DISH CATALOG */}
      {activeTab === 'dishes' && (
        <div className="space-y-6">
          {/* Filters toolbar */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3 flex-1 max-w-lg">
              <div className="relative flex-1 flex items-center">
                <Search size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search recipes, categories, or Tamil terms..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-sm focus:border-primary transition-all duration-200"
                />
              </div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="p-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 capitalize"
              >
                <option value="">All Courses</option>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {Object.keys(groupedItems).length > 0 && (
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                {Object.keys(groupedItems).length} Categories listed
              </div>
            )}
          </div>

          {/* Catalog Listing */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 shimmer-loading rounded-premium h-40 flex items-center justify-center">
              Loading recipe registry...
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            <div className="p-12 text-center text-slate-400 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50">
              No matching recipes found in the catalog.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(groupedItems).sort().map((catName) => {
                const isExpanded = expandedCategories[catName] !== false; // expanded by default
                const catItems = groupedItems[catName];

                return (
                  <div 
                    key={catName} 
                    className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleCategory(catName)}>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                          <Flame size={15} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {catName}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold font-mono">
                              {catItems.length}
                            </span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => toggleCategory(catName)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Table (Expanded) */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                              <th className="py-2.5 px-2 w-[70%]">Dish Name</th>
                              <th className="py-2.5 px-2">Course</th>
                              <th className="py-2.5 px-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catItems.map((item) => (
                              <tr 
                                key={item._id}
                                className="border-b border-slate-100 dark:border-slate-800/40 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors"
                              >
                                <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-200">
                                  {item.name}
                                </td>
                                <td className="py-2.5 px-2 capitalize">
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-secondary text-[9px] font-semibold">
                                    {item.course}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-right space-x-1">
                                  <button
                                    onClick={() => handleOpenEditDish(item)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-all duration-150"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDish(item._id)}
                                    className="p-1.5 hover:bg-danger/10 rounded-lg text-slate-500 hover:text-danger transition-all duration-150"
                                  >
                                    <Trash size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMBO & PACKAGE TEMPLATES */}
      {activeTab === 'combos' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure combination templates. You can load these templates directly inside any event menu planner to save time.
          </p>

          {combosLoading ? (
            <div className="py-20 text-center text-slate-400 shimmer-loading rounded-premium h-40 flex items-center justify-center">
              Loading combo configurations...
            </div>
          ) : combos.length === 0 ? (
            <div className="p-12 text-center text-slate-400 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50">
              No custom Combo menus registered yet. Click "New Combo Template" to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.map((combo) => {
                const isComboExpanded = expandedCombos[combo._id];

                return (
                  <div 
                    key={combo._id} 
                    className="p-5 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-premium flex flex-col justify-between hover:shadow-premium-hover transition-all duration-200"
                  >
                    <div>
                      {/* Course + Category Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          combo.course === 'breakfast' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                            : combo.course === 'lunch'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                          {combo.course}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {combo.category || 'Combo'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 truncate">{combo.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 h-8 leading-relaxed mb-4">
                        {combo.description || 'No description available for this package.'}
                      </p>

                      {/* Summary Banner */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60 mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Package Size</p>
                          <p className="font-extrabold text-sm text-primary dark:text-secondary">{combo.items.length} Selected Dishes</p>
                        </div>
                      </div>

                      {/* Collapsible Dishes list */}
                      <div className="mb-4">
                        <button
                          onClick={() => toggleComboExpand(combo._id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-primary dark:hover:text-secondary py-1 focus:outline-none"
                        >
                          <span>{isComboExpanded ? 'Hide Dishes List' : 'View Dishes Included'}</span>
                          {isComboExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isComboExpanded && (
                          <div className="mt-2 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-1 max-h-40 overflow-y-auto pr-1">
                            {combo.items.map((itemName, index) => (
                              <div key={index} className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 py-0.5">
                                <span className="truncate pr-2">• {itemName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-1">
                      <button
                        onClick={() => handleOpenEditCombo(combo)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-primary hover:text-white dark:bg-slate-800 dark:hover:bg-primary text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Edit size={11} />
                        Edit Template
                      </button>
                      <button
                        onClick={() => handleDeleteCombo(combo._id)}
                        className="px-2 py-1.5 hover:bg-danger/10 text-slate-400 hover:text-danger rounded-lg transition-all"
                        title="Delete Combo template"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DISH CREATE/EDIT MODAL */}
      <Modal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        title={editingItem ? 'Edit Dish details' : 'Register Custom Recipe'}
      >
        <form onSubmit={handleSaveDish} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Recipe Name</label>
            <input
              type="text"
              required
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g. Wheat Halwa (கோதுமை அல்வா)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Course Segment</label>
            <select
              value={dishCourse}
              onChange={(e) => setDishCourse(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs capitalize focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Category Section</label>
            <input
              type="text"
              value={dishCategory}
              onChange={(e) => setDishCategory(e.target.value)}
              list="categories-list"
              placeholder="e.g. Sweets Varieties, Vada Varieties"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <datalist id="categories-list">
              {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
            <p className="text-[9px] text-slate-400">Select an existing category section or type a new one to group dishes.</p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingItem ? 'Save Recipe Profile' : 'Publish to Catalog'}
          </button>
        </form>
      </Modal>

      {/* COMBO PLANNER / EDITOR MODAL */}
      <Modal
        isOpen={isComboModalOpen}
        onClose={() => setIsComboModalOpen(false)}
        title={editingCombo ? 'Edit Combo Template' : 'Configure Custom Combo Package'}
      >
        <form onSubmit={handleSaveCombo} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Combo Title</label>
            <input
              type="text"
              required
              value={comboName}
              onChange={(e) => setComboName(e.target.value)}
              placeholder="e.g. Combo 1 (Night Tiffin / Dinner)"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Default Course</label>
              <select
                value={comboCourse}
                onChange={(e) => setComboCourse(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:border-primary"
              >
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Combo Category Tag</label>
              <input
                type="text"
                value={comboCategory}
                onChange={(e) => setComboCategory(e.target.value)}
                placeholder="e.g. Night Tiffin, Traditional Lunch"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea
              value={comboDescription}
              onChange={(e) => setComboDescription(e.target.value)}
              rows={2}
              placeholder="Provide a brief summary of this combination package..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary"
            />
          </div>

          {/* Transfer list panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
            
            {/* Master selection search catalog */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between min-h-[220px]">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Add Master Recipes</label>
                <div className="relative flex items-center mb-2">
                  <Search size={12} className="absolute left-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={comboSearch}
                    onChange={(e) => setComboSearch(e.target.value)}
                    placeholder="Search master dishes..."
                    className="w-full pl-7 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px]"
                  />
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {menuItems
                    .filter(item => 
                      item.name.toLowerCase().includes(comboSearch.toLowerCase()) || 
                      item.category.toLowerCase().includes(comboSearch.toLowerCase())
                    )
                    .slice(0, 15) // Limit view length for performance
                    .map(item => (
                      <div 
                        key={item._id}
                        onClick={() => handleAddDishToCombo(item.name)}
                        className="p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-lg hover:border-primary/50 cursor-pointer flex justify-between items-center text-[10px] text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate pr-1">{item.name}</span>
                        <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">+</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Selected dishes inside combo list */}
            <div className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-semibold">Selected Combo Items ({comboItems.length})</label>
                </div>
                <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                  {comboItems.length === 0 ? (
                    <p className="text-center text-[10px] text-slate-400 py-8">Select recipes from catalog on the left to build combo.</p>
                  ) : (
                    comboItems.map((itemName, index) => (
                      <div 
                        key={index}
                        className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px]"
                      >
                        <span className="truncate pr-1">{itemName}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveDishFromCombo(itemName)}
                          className="p-0.5 hover:bg-danger/10 text-danger rounded"
                        >
                          <X size={10} className="stroke-[3]" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 focus:outline-none"
          >
            {editingCombo ? 'Save Combo Template' : 'Publish Package Template'}
          </button>
        </form>
      </Modal>
    </div>
  );
}


