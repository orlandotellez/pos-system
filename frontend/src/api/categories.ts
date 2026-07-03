import { api } from "./client";

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories"),
};
