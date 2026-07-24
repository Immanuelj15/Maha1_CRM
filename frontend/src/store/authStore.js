import { create } from 'zustand';
import axios from 'axios';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
};

let storedToken = localStorage.getItem('catermaster_token') || null;
let storedUser = localStorage.getItem('catermaster_user') 
  ? JSON.parse(localStorage.getItem('catermaster_user')) 
  : null;

if (storedToken && isTokenExpired(storedToken)) {
  localStorage.removeItem('catermaster_token');
  localStorage.removeItem('catermaster_user');
  storedToken = null;
  storedUser = null;
}

// Configure global Axios defaults
axios.defaults.baseURL = ''; // Proxy handles mapping to http://localhost:5000
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

export const useAuthStore = create((set, get) => ({
  token: storedToken,
  user: storedUser,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post('/api/v1/auth/login', { email, password });
      
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        
        localStorage.setItem('catermaster_token', token);
        localStorage.setItem('catermaster_user', JSON.stringify(userData));
        
        // Update axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({
          token,
          user: userData,
          isAuthenticated: true,
          loading: false
        });
        return true;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check connection.';
      set({ error: msg, loading: false });
      return false;
    }
  },

  register: async (username, email, password, businessName) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post('/api/v1/auth/register', { username, email, password, businessName });
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        
        localStorage.setItem('catermaster_token', token);
        localStorage.setItem('catermaster_user', JSON.stringify(userData));
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({
          token,
          user: userData,
          isAuthenticated: true,
          loading: false
        });
        return true;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      set({ error: msg, loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('catermaster_token');
    localStorage.removeItem('catermaster_user');
    delete axios.defaults.headers.common['Authorization'];
    set({
      token: null,
      user: null,
      isAuthenticated: false
    });
  },

  fetchProfile: async () => {
    if (!get().token) return;
    try {
      const res = await axios.get('/api/v1/auth/profile');
      if (res.data.success) {
        set({ user: res.data.data });
        localStorage.setItem('catermaster_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to load user profile:', err.message);
      if (err.response?.status === 401) {
        get().logout();
      }
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.put('/api/v1/auth/profile', profileData);
      if (res.data.success) {
        set({ user: res.data.data, loading: false });
        localStorage.setItem('catermaster_user', JSON.stringify(res.data.data));
        return true;
      }
    } catch (err) {
      set({ error: err.response?.data?.message || 'Update failed', loading: false });
      return false;
    }
  }
}));
