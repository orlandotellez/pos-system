import type { IBatchEntity, CreateBatchData } from "./batch-inventory.entities"

export interface IBatchInventoryRepository {
  create(data: CreateBatchData): Promise<IBatchEntity>
  findById(id: string, storeId?: string): Promise<IBatchEntity | null>
  findAll(params?: { movement_type?: string; supplier_id?: string; page?: number; limit?: number; storeId?: string }): Promise<{ batches: IBatchEntity[]; total: number; page: number; limit: number }>
}
