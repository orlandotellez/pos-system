export interface IServiceProductResponse {
  id: string
  product_id: string
  product_name: string
  product_price: number
  quantity: number
}

export interface IServiceResponse {
  id: string
  name: string
  description?: string
  base_price: number
  is_active: boolean
  products: IServiceProductResponse[]
  created_at: string
  updated_at: string
}

export interface IServiceListResponse {
  services: IServiceResponse[]
  total: number
  page: number
  limit: number
}

export interface IServiceQueryParams {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}
