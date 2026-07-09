import type { IProductEntity, CreateProductData, UpdateProductData } from "./products.entities"

export interface IProductRepository {
  findAll(params?: { search?: string; category_id?: string; active?: boolean; lowStock?: boolean; outOfStock?: boolean; page?: number; limit?: number; storeId?: string }): Promise<{ products: IProductEntity[]; total: number; page: number; limit: number }>
  findById(id: string, storeId?: string): Promise<IProductEntity | null>
  findByBarcode(barcode: string, storeId?: string): Promise<IProductEntity | null>
  create(data: CreateProductData, storeId?: string): Promise<IProductEntity>
  update(id: string, data: UpdateProductData, storeId?: string): Promise<IProductEntity>
  softDelete(id: string, storeId?: string): Promise<void>
  updateStock(id: string, quantity: number, storeId?: string): Promise<IProductEntity>
}
