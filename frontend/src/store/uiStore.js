import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  modalOpen: null,
  modalData: null,
  searchQuery: '',
  activeFilters: {},

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openModal: (modalName, data = null) => set({ modalOpen: modalName, modalData: data }),
  closeModal: () => set({ modalOpen: null, modalData: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearch: () => set({ searchQuery: '' }),

  setFilter: (key, value) => set((state) => ({
    activeFilters: { ...state.activeFilters, [key]: value }
  })),
  clearFilters: () => set({ activeFilters: {} }),
  removeFilter: (key) => set((state) => {
    const newFilters = { ...state.activeFilters };
    delete newFilters[key];
    return { activeFilters: newFilters };
  }),
}));
