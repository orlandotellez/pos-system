import type { ISupplierEntity, CreateSupplierData, UpdateSupplierData } from "./suppliers.entities"

export interface ISupplierRepository {
  findAll(params?: { search?: string; is_active?: boolean; page?: number; limit?: number }): Promise<{ suppliers: ISupplierEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<ISupplierEntity | null>
  create(data: CreateSupplierData): Promise<ISupplierEntity>
  update(id: string, data: UpdateSupplierData): Promise<ISupplierEntity>
  softDelete(id: string): Promise<void>
}
