import { User, HistoryItem } from '../types';

const USERS_KEY = 'agriscan_users';
const HISTORY_KEY = 'agriscan_history';
const ACTIVE_USER_KEY = 'agriscan_active_user';

export const authService = {
  signup: (phone: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[phone]) return false; // Already exists
    users[phone] = { phone, password };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },
  
  login: (phone: string, password: string): User | null => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[phone];
    if (user && user.password === password) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({ phone }));
      return { phone };
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(ACTIVE_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(ACTIVE_USER_KEY);
    return data ? JSON.parse(data) : null;
  }
};

export const historyService = {
  saveItem: (userPhone: string, item: HistoryItem) => {
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    if (!allHistory[userPhone]) allHistory[userPhone] = [];
    
    // Add to beginning
    allHistory[userPhone].unshift(item);
    
    // Limit to 20 items per user to save space
    if (allHistory[userPhone].length > 20) {
      allHistory[userPhone] = allHistory[userPhone].slice(0, 20);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
  },

  getItems: (userPhone: string): HistoryItem[] => {
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    return allHistory[userPhone] || [];
  },

  deleteItem: (userPhone: string, itemId: string) => {
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    if (!allHistory[userPhone]) return;
    
    allHistory[userPhone] = allHistory[userPhone].filter((i: HistoryItem) => i.id !== itemId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
  }
};