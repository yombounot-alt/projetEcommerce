/**
 * Types transverses utilisés dans toute l'application.
 */

export type UUID = string;
export type ISODateString = string;

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorPayload {
  message: string;
  code: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}

export type SortDirection = "asc" | "desc";

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

/**
 * État UI générique pour les ressources chargées côté client (hors TanStack Query).
 */
export type AsyncStatus = "idle" | "loading" | "success" | "error";
