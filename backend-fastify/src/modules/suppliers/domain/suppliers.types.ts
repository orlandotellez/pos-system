export interface ISupplierResponse {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active: boolean
  product_count?: number
  created_at: string
  updated_at: string
}

export interface ISupplierListResponse {
  suppliers: ISupplierResponse[]
  total: number
  page: number
  limit: number
}
