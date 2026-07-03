import type { IServiceEntity, CreateServiceData, UpdateServiceData } from "./services.entities"

export interface IServiceRepository {
  findAll(params?: { search?: string; active?: boolean; page?: number; limit?: number }): Promise<{ services: IServiceEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<IServiceEntity | null>
  create(data: CreateServiceData): Promise<IServiceEntity>
  update(id: string, data: UpdateServiceData): Promise<IServiceEntity>
  softDelete(id: string): Promise<void>
}
