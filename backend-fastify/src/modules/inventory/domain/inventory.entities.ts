export interface IInventoryMovementEntity {
  id: string
  product_id: string
  product_name?: string
  movement_type: string
  quantity: number
  note?: string
  user_id: string
  batch_id?: string
  created_at: Date
}

export type CreateMovementData = {
  product_id: string
  movement_type: "entrada" | "salida" | "ajuste"
  quantity: number
  note?: string
  batch_id?: string
  user_id: string
}
