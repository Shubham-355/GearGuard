import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
      },
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(data);
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      registerCompany: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.registerCompany(data);
          const { user, token, company } = response.data.data;
          localStorage.setItem('token', token);
          set({ user: { ...user, company }, token, isAuthenticated: true, isLoading: false });
          return { success: true, inviteCode: company.inviteCode };
        } catch (error) {
          const message = error.response?.data?.message || 'Company registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      joinWithCode: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.joinWithCode(data);
          const { user, token } = response.data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to join company';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const response = await authAPI.getProfile();
          set({ user: response.data.data, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          localStorage.removeItem('token');
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.updateProfile(data);
          set({ user: response.data.data, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
