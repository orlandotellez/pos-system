import type { ISaleEntity, ISaleItemEntity, CreateSaleData, CreateSaleServiceItemProductData } from "./sales.entities"

export interface ISaleRepository {
  create(data: CreateSaleData, serviceProductsToDeduct?: { product_id: string; quantity: number }[], customServiceProducts?: Map<string, CreateSaleServiceItemProductData[]>): Promise<ISaleEntity>
  findById(id: string): Promise<ISaleEntity | null>
  findAll(params?: { startDate?: Date; endDate?: Date; userId?: string; paymentMethod?: string; page?: number; limit?: number }): Promise<{ sales: ISaleEntity[]; total: number }>
  getReport(params?: { startDate?: Date; endDate?: Date }): Promise<{
    totalSales: number
    totalRevenue: number
    totalTax: number
    totalDiscount: number
    averageTicket: number
    salesByPaymentMethod: Record<string, number>
    topProducts: { productName: string; quantity: number; revenue: number }[]
  }>

  getRevenueTrend(params: { startDate: Date; endDate: Date; groupBy: "day" | "week" | "month" }): Promise<{ date: string; revenue: number }[]>
}
