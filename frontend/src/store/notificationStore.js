import { create } from 'zustand';
import axios from 'axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await axios.get('/api/v1/notifications');
      if (res.data.success) {
        const notifications = res.data.data || [];
        const unreadCount = notifications.filter(n => n.status === 'unread').length;
        set({ notifications, unreadCount, loading: false });
      }
    } catch (error) {
      console.error('Fetch notifications error:', error.message);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await axios.put(`/api/v1/notifications/read/${id}`);
      if (res.data.success) {
        const updatedList = get().notifications.map(n => 
          n._id === id ? { ...n, status: 'read' } : n
        );
        const unreadCount = updatedList.filter(n => n.status === 'unread').length;
        set({ notifications: updatedList, unreadCount });
      }
    } catch (error) {
      console.error('Mark read notification error:', error.message);
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await axios.post('/api/v1/notifications/read-all');
      if (res.data.success) {
        const updatedList = get().notifications.map(n => ({ ...n, status: 'read' }));
        set({ notifications: updatedList, unreadCount: 0 });
      }
    } catch (error) {
      console.error('Mark all read error:', error.message);
    }
  }
}));
