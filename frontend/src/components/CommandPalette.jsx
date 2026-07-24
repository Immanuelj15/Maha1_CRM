import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Navigation, UserPlus, CalendarPlus, Receipt, CreditCard } from 'lucide-react';
import axios from 'axios';

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Perform search queries
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const [custRes, eventRes] = await Promise.all([
          axios.get(`/api/v1/customers?search=${query}`),
          axios.get('/api/v1/events')
        ]);

        const customers = (custRes.data.data || []).map(c => ({
          type: 'customer',
          id: c._id,
          title: c.name,
          subtitle: `Customer • ${c.phone} • ${c.email}`,
          path: `/customers?id=${c._id}`
        }));

        const events = (eventRes.data.data || [])
          .filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
          .map(e => ({
            type: 'event',
            id: e._id,
            title: e.name,
            subtitle: `Event • Date: ${e.date} • Status: ${e.status}`,
            path: `/events?id=${e._id}`
          }));

        setResults([...customers, ...events].slice(0, 8));
      } catch (err) {
        console.error('Command search error:', err.message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const defaultShortcuts = [
    { type: 'action', title: 'Add Customer', subtitle: 'Open customer creation drawer', action: () => { onClose(); navigate('/customers?action=add'); }, icon: UserPlus },
    { type: 'action', title: 'Create Event', subtitle: 'Open event reservation forms', action: () => { onClose(); navigate('/events?action=add'); }, icon: CalendarPlus },
    { type: 'action', title: 'Generate Invoice', subtitle: 'Create client billing sheet', action: () => { onClose(); navigate('/invoices?action=add'); }, icon: Receipt },
    { type: 'action', title: 'Record Payment', subtitle: 'Post cash/UPI collection log', action: () => { onClose(); navigate('/payments?action=add'); }, icon: CreditCard },
    { type: 'nav', title: 'Go to Groceries', subtitle: 'Navigate to inventory spreadsheet', action: () => { onClose(); navigate('/groceries'); }, icon: Navigation },
  ];

  const handleSelect = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      onClose();
      navigate(item.path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] px-4"
          >
            {/* Palette Drawer */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[600px] rounded-premium glass-modal shadow-2xl overflow-hidden flex flex-col max-h-[50vh] border border-slate-200/50 dark:border-slate-800"
            >
              {/* Input search box */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/50 dark:border-slate-800">
                <Search size={18} className="text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer, event, or type shortcut command..."
                  className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 shadow-sm">
                  ESC
                </kbd>
              </div>

              {/* Suggestions / Results */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {query ? (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Search Results
                    </div>
                    {loading ? (
                      <div className="py-8 text-center text-xs text-slate-400 shimmer-loading rounded-xl mx-2">
                        Querying registry database...
                      </div>
                    ) : results.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        No customers or events matching "{query}" found.
                      </div>
                    ) : (
                      results.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl cursor-pointer transition-all duration-150"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                            <Sparkles size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Quick Shortcuts & Tools
                    </div>
                    {defaultShortcuts.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelect(item)}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl cursor-pointer transition-all duration-150"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/5 text-primary dark:bg-secondary/5 dark:text-secondary flex items-center justify-center flex-shrink-0">
                          <item.icon size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
