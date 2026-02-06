/**
 * Zustand UI State Store
 * Manages global UI state: modals, sidebars, filters, etc.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useUiStore = create<{
  // Modals
  isCreateEventOpen: boolean;
  isCreateSessionOpen: boolean;
  isCreateUserOpen: boolean;
  isBulkImportOpen: boolean;
  isSettingsOpen: boolean;

  // Sidebar
  isSidebarOpen: boolean;

  // Selected items
  selectedEventId: string | null;
  selectedDistrictId: string | null;

  // Methods
  openCreateEvent: () => void;
  closeCreateEvent: () => void;
  openCreateSession: () => void;
  closeCreateSession: () => void;
  openCreateUser: () => void;
  closeCreateUser: () => void;
  openBulkImport: () => void;
  closeBulkImport: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectEvent: (eventId: string | null) => void;
  selectDistrict: (districtId: string | null) => void;
}>()(
  devtools(
    (set) => ({
      isCreateEventOpen: false,
      isCreateSessionOpen: false,
      isCreateUserOpen: false,
      isBulkImportOpen: false,
      isSettingsOpen: false,
      isSidebarOpen: true,
      selectedEventId: null,
      selectedDistrictId: null,

      openCreateEvent: () => set({ isCreateEventOpen: true }),
      closeCreateEvent: () => set({ isCreateEventOpen: false }),
      openCreateSession: () => set({ isCreateSessionOpen: true }),
      closeCreateSession: () => set({ isCreateSessionOpen: false }),
      openCreateUser: () => set({ isCreateUserOpen: true }),
      closeCreateUser: () => set({ isCreateUserOpen: false }),
      openBulkImport: () => set({ isBulkImportOpen: true }),
      closeBulkImport: () => set({ isBulkImportOpen: false }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      selectEvent: (eventId) => set({ selectedEventId: eventId }),
      selectDistrict: (districtId) => set({ selectedDistrictId: districtId }),
    }),
    {
      name: "UiStore",
    }
  )
);