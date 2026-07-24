import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { Plus, Trash, Calculator, Flame, Sparkles } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const staticPresetDishes = {
  breakfast: [
    { name: 'Scrambled Eggs', unitCost: 1.5, category: 'Eggs' },
    { name: 'Fruit Salad', unitCost: 2.2, category: 'Fruits' },
    { name: 'Coffee/Tea', unitCost: 0.8, category: 'Beverage' },
    { name: 'Butter Toast', unitCost: 0.5, category: 'Bakery' }
  ],
  lunch: [
    { name: 'Chicken Biryani', unitCost: 6.0, category: 'Chicken' },
    { name: 'Vegetable Biryani', unitCost: 4.0, category: 'Veg' },
    { name: 'Paneer Butter Masala', unitCost: 5.5, category: 'Dairy' },
    { name: 'Dal Makhani', unitCost: 3.5, category: 'Veg' },
    { name: 'Butter Naan', unitCost: 1.0, category: 'Bakery' },
    { name: 'Gulab Jamun', unitCost: 1.2, category: 'Dessert' }
  ],
  dinner: [
    { name: 'Chicken Biryani', unitCost: 6.0, category: 'Chicken' },
    { name: 'Paneer Butter Masala', unitCost: 5.5, category: 'Dairy' },
    { name: 'Butter Naan', unitCost: 1.0, category: 'Bakery' },
    { name: 'Dal Makhani', unitCost: 3.5, category: 'Veg' },
    { name: 'Gulab Jamun', unitCost: 1.2, category: 'Dessert' }
  ]
};

export default function MenuPlanner({ guestCount = 1, menuPlan = { breakfast: [], lunch: [], dinner: [] }, onUpdateMenu }) {
  const { settings } = useSettingsStore();
  const currencySymbol = settings?.currencySymbol || '₹';
  const [activeTab, setActiveTab] = useState('breakfast'); // breakfast | lunch | dinner
  const [presetDishes, setPresetDishes] = useState(staticPresetDishes);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDishesAndCombos = async () => {
      try {
        const [dishesRes, combosRes] = await Promise.all([
          axios.get('/api/v1/menu-items'),
          axios.get('/api/v1/combos')
        ]);
        
        const items = dishesRes.data.data || [];
        if (items.length > 0) {
          const grouped = { breakfast: [], lunch: [], dinner: [] };
          items.forEach(item => {
            const course = item.course; // breakfast | lunch | dinner
            if (grouped[course]) {
              grouped[course].push({
                name: item.name,
                unitCost: item.unitCost,
                category: item.category || 'Others'
              });
            }
          });
          setPresetDishes(grouped);
        }
        
        setCombos(combosRes.data.data || []);
      } catch (error) {
        console.error('Error fetching menu items/combos, falling back to static presets:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDishesAndCombos();
  }, []);

  const handleAddItem = (dish) => {
    const currentCourse = menuPlan[activeTab] || [];
    
    // Check if dish already exists in that course
    if (currentCourse.some(item => item.name === dish.name)) return;

    const updatedCourse = [...currentCourse, {
      name: dish.name,
      quantity: 1, // Default factor multiplier
      estimatedCost: dish.unitCost
    }];

    onUpdateMenu({
      ...menuPlan,
      [activeTab]: updatedCourse
    });
  };

  const handleLoadCombo = (comboId) => {
    const combo = combos.find(c => c._id === comboId);
    if (!combo) return;

    const itemsToLoad = combo.items.map(dishName => {
      const match = presetDishes[activeTab]?.find(d => d.name === dishName);
      const fallbackMatch = match || 
        presetDishes.breakfast?.find(d => d.name === dishName) ||
        presetDishes.lunch?.find(d => d.name === dishName) ||
        presetDishes.dinner?.find(d => d.name === dishName);

      return {
        name: dishName,
        quantity: 1,
        estimatedCost: fallbackMatch ? fallbackMatch.unitCost : 25
      };
    });

    onUpdateMenu({
      ...menuPlan,
      [activeTab]: itemsToLoad
    });
    toast.success(`Loaded combo "${combo.name}" into ${activeTab}!`);
  };

  const getComboPerHeadCost = (combo) => {
    return combo.items.reduce((sum, itemName) => {
      const match = 
        presetDishes.breakfast?.find(d => d.name === itemName) ||
        presetDishes.lunch?.find(d => d.name === itemName) ||
        presetDishes.dinner?.find(d => d.name === itemName);
      return sum + (match ? match.unitCost : 0);
    }, 0);
  };

  const handleRemoveItem = (idx) => {
    const currentCourse = menuPlan[activeTab] || [];
    const updatedCourse = currentCourse.filter((_, i) => i !== idx);

    onUpdateMenu({
      ...menuPlan,
      [activeTab]: updatedCourse
    });
  };

  const handleQtyChange = (idx, value) => {
    const qty = Math.max(1, parseInt(value) || 1);
    const currentCourse = menuPlan[activeTab] || [];
    const updatedCourse = currentCourse.map((item, i) => 
      i === idx ? { ...item, quantity: qty } : item
    );

    onUpdateMenu({
      ...menuPlan,
      [activeTab]: updatedCourse
    });
  };

  const calculateCourseTotal = (course) => {
    return (menuPlan[course] || []).reduce((sum, item) => 
      sum + (item.estimatedCost * item.quantity * guestCount), 0
    );
  };

  const calculateGrandTotal = () => {
    return calculateCourseTotal('breakfast') + calculateCourseTotal('lunch') + calculateCourseTotal('dinner');
  };

  const activeCourseCombos = combos.filter(c => c.course === activeTab);

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="p-4 rounded-premium bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Calculator className="text-primary" size={16} />
          <span>Cost Calculator ({guestCount} Guests)</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Menu Cost: </span>
          <span className="font-bold text-primary dark:text-secondary text-base">
            {currencySymbol}{calculateGrandTotal().toFixed(2)}
          </span>
        </div>
      </div>

      {/* Course Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200/50 dark:border-slate-800 pb-2">
        {['breakfast', 'lunch', 'dinner'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
              activeTab === tab
                ? 'bg-primary text-white shadow-md'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab} ({currencySymbol}{calculateCourseTotal(tab).toFixed(0)})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: Preset dishes registry selector */}
        <div className="p-4 rounded-premium bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Available Dishes ({activeTab})</h4>
            {activeCourseCombos.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) handleLoadCombo(val);
                  }}
                  className="p-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  <option value="">⚡ Quick Load Combo</option>
                  {activeCourseCombos.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({currencySymbol}{getComboPerHeadCost(c).toFixed(0)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
            {presetDishes[activeTab].map((dish, i) => (
              <div
                key={i}
                onClick={() => handleAddItem(dish)}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex items-center justify-between cursor-pointer hover:border-primary/50 dark:hover:border-secondary/50 hover:shadow-sm transition-all duration-150"
              >
                <div>
                  <p className="text-xs font-semibold">{dish.name}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{dish.category} • {currencySymbol}{dish.unitCost}/person</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Plus size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Active Event Menu selections */}
        <div className="p-4 rounded-premium bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Selected Menu</h4>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {(menuPlan[activeTab] || []).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No dishes added to {activeTab} yet.
                </div>
              ) : (
                (menuPlan[activeTab] || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Est: {currencySymbol}{(item.estimatedCost * item.quantity * guestCount).toFixed(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="w-12 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 hover:bg-danger/10 text-danger rounded-lg transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex justify-between items-center text-xs">
            <span className="text-slate-500">Course Total:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{currencySymbol}{calculateCourseTotal(activeTab).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
