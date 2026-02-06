/**
 * Zustand Filter Store
 * Manages filter state for tables, lists, and reports
 */

import { Role, VoicePart } from "@/prisma/generated/enums";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Filters {
  dateFrom: Date | null;
  dateTo: Date | null;
  voiceParts: VoicePart[];
  roles: Role[];
  districtIds: string[];
  searchQuery: string;
  sortBy: "name" | "attendance" | "date" | "percentage";
  sortOrder: "asc" | "desc";
  pageSize: number;
  currentPage: number;
}

export const useFilterStore = create<{
  filters: Filters;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setVoiceParts: (parts: VoicePart[]) => void;
  setRoles: (roles: Role[]) => void;
  setDistricts: (districtIds: string[]) => void;
  setSearch: (query: string) => void;
  setSort: (sortBy: Filters["sortBy"], sortOrder: "asc" | "desc") => void;
  setPageSize: (size: number) => void;
  setCurrentPage: (page: number) => void;
  resetFilters: () => void;
  toggleVoicePart: (part: VoicePart) => void;
  toggleRole: (role: Role) => void;
  toggleDistrict: (districtId: string) => void;
}>()(
  devtools(
    (set) => {
      const defaultFilters: Filters = {
        dateFrom: null,
        dateTo: null,
        voiceParts: [],
        roles: [],
        districtIds: [],
        searchQuery: "",
        sortBy: "date",
        sortOrder: "desc",
        pageSize: 25,
        currentPage: 1,
      };

      return {
        filters: defaultFilters,

        setDateRange: (from, to) =>
          set((state) => ({
            filters: {
              ...state.filters,
              dateFrom: from,
              dateTo: to,
              currentPage: 1,
            },
          })),

        setVoiceParts: (parts) =>
          set((state) => ({
            filters: { ...state.filters, voiceParts: parts, currentPage: 1 },
          })),

        setRoles: (roles) =>
          set((state) => ({
            filters: { ...state.filters, roles, currentPage: 1 },
          })),

        setDistricts: (districtIds) =>
          set((state) => ({
            filters: { ...state.filters, districtIds, currentPage: 1 },
          })),

        setSearch: (query) =>
          set((state) => ({
            filters: { ...state.filters, searchQuery: query, currentPage: 1 },
          })),

        setSort: (sortBy, sortOrder) =>
          set((state) => ({
            filters: { ...state.filters, sortBy, sortOrder },
          })),

        setPageSize: (size) =>
          set((state) => ({
            filters: { ...state.filters, pageSize: size, currentPage: 1 },
          })),

        setCurrentPage: (page) =>
          set((state) => ({
            filters: { ...state.filters, currentPage: page },
          })),

        resetFilters: () => set({ filters: defaultFilters }),

        toggleVoicePart: (part) =>
          set((state) => ({
            filters: {
              ...state.filters,
              voiceParts: state.filters.voiceParts.includes(part)
                ? state.filters.voiceParts.filter((p) => p !== part)
                : [...state.filters.voiceParts, part],
              currentPage: 1,
            },
          })),

        toggleRole: (role) =>
          set((state) => ({
            filters: {
              ...state.filters,
              roles: state.filters.roles.includes(role)
                ? state.filters.roles.filter((r) => r !== role)
                : [...state.filters.roles, role],
              currentPage: 1,
            },
          })),

        toggleDistrict: (districtId) =>
          set((state) => ({
            filters: {
              ...state.filters,
              districtIds: state.filters.districtIds.includes(districtId)
                ? state.filters.districtIds.filter((id) => id !== districtId)
                : [...state.filters.districtIds, districtId],
              currentPage: 1,
            },
          })),
      };
    },
    {
      name: "FilterStore",
    }
  )
);
