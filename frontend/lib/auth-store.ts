import { create } from 'zustand';

export interface AuthUser {
  userId: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: AuthUser | null, token: string | null) => void;
  logout: () => void;
  initializeFromSession: () => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  setUser: (user: AuthUser | null, token: string | null) => {
    if (user && token) {
      // Store in session storage (not persisted between sessions for security)
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('auth_token', token);
    }
    set({ user, token, error: null });
  },

  logout: () => {
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    set({ user: null, token: null });
  },

  initializeFromSession: () => {
    try {
      const userJson = sessionStorage.getItem('auth_user');
      const token = sessionStorage.getItem('auth_token');

      if (userJson && token) {
        const user = JSON.parse(userJson);
        set({ user, token });
      }
    } catch (err) {
      console.error('Failed to restore auth from session:', err);
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
    }
  },

  setToken: (token: string | null) => {
    if (token) {
      sessionStorage.setItem('auth_token', token);
    } else {
      sessionStorage.removeItem('auth_token');
    }
    set({ token });
  },
}));
