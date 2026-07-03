import type { IProductEntity, CreateProductData, UpdateProductData } from "./products.entities"

export interface IProductRepository {
  findAll(params?: { search?: string; category_id?: string; active?: boolean; lowStock?: boolean; outOfStock?: boolean; page?: number; limit?: number }): Promise<{ products: IProductEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<IProductEntity | null>
  findByBarcode(barcode: string): Promise<IProductEntity | null>
  create(data: CreateProductData): Promise<IProductEntity>
  update(id: string, data: UpdateProductData): Promise<IProductEntity>
  softDelete(id: string): Promise<void>
  updateStock(id: string, quantity: number): Promise<IProductEntity>
}
