import type { IInventoryMovementEntity, CreateMovementData } from "./inventory.entities"

export interface IInventoryRepository {
  create(data: CreateMovementData): Promise<IInventoryMovementEntity>
  findByProductId(productId: string, params?: { limit?: number; storeId?: string }): Promise<IInventoryMovementEntity[]>
  findAll(params?: { product_id?: string; movement_type?: string; page?: number; limit?: number; storeId?: string }): Promise<{ movements: IInventoryMovementEntity[]; total: number; page: number; limit: number }>
}
