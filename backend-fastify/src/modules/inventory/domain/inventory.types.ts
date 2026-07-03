export interface IInventoryMovementResponse {
  id: string
  product_id: string
  product_name?: string
  movement_type: string
  quantity: number
  note?: string
  user_id: string
  batch_id?: string
  created_at: string
}

export interface IInventoryMovementListResponse {
  movements: IInventoryMovementResponse[]
  total: number
  page: number
  limit: number
}

export interface IProductStockResponse {
  product_id: string
  product_name: string
  current_stock: number
  low_stock_threshold: number
  is_low_stock: boolean
}
