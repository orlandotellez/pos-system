export interface IBatchItemResponse {
  id: string
  product_id: string
  product_name?: string
  quantity: number
  unit_cost?: number | null
  notes?: string | null
}

export interface IBatchResponse {
  id: string
  movement_type: string
  supplier_id?: string | null
  supplier_name?: string
  notes?: string | null
  user_id: string
  user_name?: string
  items?: IBatchItemResponse[]
  total_items: number
  total_quantity: number
  created_at: string
}

export interface IBatchListResponse {
  batches: IBatchResponse[]
  total: number
  page: number
  limit: number
}
