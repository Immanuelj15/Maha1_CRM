import { create } from 'zustand';
import axios from 'axios';

const initialTheme = localStorage.getItem('catermaster_theme') || 'light';
if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useSettingsStore = create((set, get) => ({
  theme: initialTheme,
  settings: {
    businessName: 'CaterMaster',
    email: 'contact@catermaster.com',
    phone: '+1 (555) 019-2834',
    address: '123 Gourmet Way, Culinary City',
    gstNumber: '',
    logo: '',
    invoiceNotes: 'Thank you for your business!',
    termsConditions: '50% advance required.',
    currencySymbol: '₹'
  },
  loading: false,

  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('catermaster_theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    set({ theme: nextTheme });
  },

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const res = await axios.get('/api/v1/settings');
      if (res.data.success) {
        set({ settings: res.data.data, loading: false });
      }
    } catch (error) {
      console.error('Fetch settings error:', error.message);
      set({ loading: false });
    }
  },

  updateSettings: async (settingsData) => {
    set({ loading: true });
    try {
      const res = await axios.put('/api/v1/settings', settingsData);
      if (res.data.success) {
        set({ settings: res.data.data, loading: false });
        return true;
      }
    } catch (error) {
      console.error('Update settings error:', error.message);
      set({ loading: false });
      return false;
    }
  }
}));
