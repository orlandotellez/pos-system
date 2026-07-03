import { api } from "./client";





export interface Settings {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  tax_rate: number;
  low_stock_threshold: number;
  ticket_footer?: string;
  updated_at: string;
}





export interface UpdateSettingsPayload {
  name?: string;
  address?: string | null;
  phone?: string | null;
  tax_rate?: number;
  low_stock_threshold?: number;
  ticket_footer?: string | null;
}





export const settingsApi = {
  get: () =>
    api.get<Settings>("/settings"),

  update: (data: UpdateSettingsPayload) =>
    api.put<Settings>("/settings", data),
};
