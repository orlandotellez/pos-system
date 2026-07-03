import { NotFoundError, BadRequestError } from "@/core/errors/AppError"
import { prisma } from "@/config/prisma"
import type { ISaleRepository } from "../domain/sales.interface"
import type { ISaleResponse, ISaleListResponse, ISaleReport, IRevenueTrendItem, IRevenueTrendQuery } from "../domain/sales.types"
import type { CreateSaleData, ISaleEntity, ISaleItemEntity, ISaleServiceEntity, ISaleServiceProductEntity } from "../domain/sales.entities"

/** Extended sale entity that includes nested item/service relations */
interface RichSaleService extends ISaleServiceEntity {
  products?: ISaleServiceProductEntity[]
}
interface RichSale extends ISaleEntity {
  items?: ISaleItemEntity[]
  service_items?: RichSaleService[]
}

function mapSaleToResponse(sale: RichSale): ISaleResponse {
  return {
    id: sale.id,
    subtotal: Number(sale.subtotal),
    tax_total: Number(sale.tax_total),
    discount: Number(sale.discount),
    total: Number(sale.total),
    payment_method: sale.payment_method,
    amount_received: sale.amount_received ? Number(sale.amount_received) : undefined,
    change_given: sale.change_given ? Number(sale.change_given) : undefined,
    user_id: sale.user_id,
    created_at: sale.created_at instanceof Date ? sale.created_at.toISOString() : sale.created_at,
    items: sale.items?.map((item: ISaleItemEntity) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      tax_rate: Number(item.tax_rate),
      line_total: Number(item.line_total),
    })),
    service_items: sale.service_items?.map((si: RichSaleService) => ({
      id: si.id,
      service_id: si.service_id,
      service_name: si.service_name,
      base_price: Number(si.base_price),
      line_total: Number(si.line_total),
      products: si.products?.map((sp: ISaleServiceProductEntity) => ({
        id: sp.id,
        product_id: sp.product_id,
        product_name: sp.product_name,
        quantity: sp.quantity,
        unit_price: Number(sp.unit_price),
        line_total: Number(sp.line_total),
        affects_price: sp.affects_price ?? false,
      })) || [],
    })),
  }
}

export const createSaleService = (repository: ISaleRepository) => ({
  create: async (data: CreateSaleData): Promise<ISaleResponse> => {
    // Build a unified product quantity map for stock validation
    // (regular items + service products all go into the same map)
    const productQtyMap = new Map<string, { name: string; price: number; quantity: number; stock: number }>()
    let serviceProductsToDeduct: { product_id: string; quantity: number }[] = []
    let customServiceProducts: Map<string, { product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number }[]> | undefined

    // 1. Add regular product items to the map
    if (data.items && data.items.length > 0) {
      const productIds = data.items.map((i) => i.product_id)
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, stock: true },
      })
      const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]))
      for (const item of data.items) {
        const dbProd = dbProductMap.get(item.product_id)
        if (!dbProd) throw new NotFoundError(`Product ${item.product_id} not found`)
        const existing = productQtyMap.get(item.product_id) || {
          name: dbProd.name,
          price: Number(dbProd.price),
          quantity: 0,
          stock: dbProd.stock,
        }
        existing.quantity += item.quantity
        productQtyMap.set(item.product_id, existing)
      }
    }

    // 2. If service_items exist, resolve the associated products
    if (data.service_items && data.service_items.length > 0) {
      customServiceProducts = new Map()

      const itemsWithCustomProducts = data.service_items.filter((si) => si.products && si.products.length > 0)
      const itemsWithoutCustom = data.service_items.filter((si) => !si.products || si.products.length === 0)

      // 2a. Process items with CUSTOM products
      if (itemsWithCustomProducts.length > 0) {
        const customProductIds = itemsWithCustomProducts.flatMap((si) =>
          si.products!.map((sp) => sp.product_id)
        )
        const dbProducts = await prisma.product.findMany({
          where: { id: { in: customProductIds } },
          select: { id: true, name: true, price: true, stock: true },
        })
        const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]))

        for (const si of itemsWithCustomProducts) {
          const sps: { product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number }[] = []
          for (const sp of si.products!) {
            const dbProd = dbProductMap.get(sp.product_id)
            if (!dbProd) throw new NotFoundError(`Product ${sp.product_id} not found`)

            const existing = productQtyMap.get(sp.product_id) || {
              name: dbProd.name,
              price: Number(dbProd.price),
              quantity: 0,
              stock: dbProd.stock,
            }
            existing.quantity += sp.quantity
            productQtyMap.set(sp.product_id, existing)
            sps.push(sp)
          }
          customServiceProducts.set(si.service_id, sps)
        }
      }

      // 2b. Process items WITHOUT custom products (auto-lookup from service_product)
      if (itemsWithoutCustom.length > 0) {
        const serviceIds = itemsWithoutCustom.map((si) => si.service_id)
        const serviceProducts = await prisma.service_product.findMany({
          where: { service_id: { in: serviceIds } },
          include: { product: { select: { id: true, name: true, price: true, stock: true } } },
        })

        for (const sp of serviceProducts) {
          const existing = productQtyMap.get(sp.product_id) || {
            name: sp.product.name,
            price: Number(sp.product.price),
            quantity: 0,
            stock: sp.product.stock,
          }
          existing.quantity += sp.quantity
          productQtyMap.set(sp.product_id, existing)
        }
      }

      if (productQtyMap.size === 0) {
        throw new BadRequestError("No products found for the selected services")
      }

      serviceProductsToDeduct = Array.from(productQtyMap.entries()).map(([product_id, info]) => ({
        product_id,
        quantity: info.quantity,
      }))
    }

    // 3. Unified stock validation across ALL products (regular + service)
    if (productQtyMap.size > 0) {
      const insufficientStock: string[] = []
      for (const [prodId, info] of productQtyMap) {
        if (info.stock < info.quantity) {
          insufficientStock.push(`${info.name} (disponible: ${info.stock}, requerido: ${info.quantity})`)
        }
      }
      if (insufficientStock.length > 0) {
        throw new BadRequestError(
          `Insufficient stock for: ${insufficientStock.join(", ")}`
        )
      }
    }

    const sale = await repository.create(data, serviceProductsToDeduct, customServiceProducts)
    return mapSaleToResponse(sale)
  },

  getById: async (id: string): Promise<ISaleResponse> => {
    const sale = await repository.findById(id)
    if (!sale) {
      throw new NotFoundError("Sale not found")
    }
    return mapSaleToResponse(sale)
  },

  list: async (params?: { start_date?: string; end_date?: string; user_id?: string; payment_method?: string; page?: number; limit?: number }): Promise<ISaleListResponse> => {
    const result = await repository.findAll({
      startDate: params?.start_date ? new Date(params.start_date) : undefined,
      endDate: params?.end_date ? new Date(params.end_date) : undefined,
      userId: params?.user_id,
      paymentMethod: params?.payment_method,
      page: params?.page,
      limit: params?.limit,
    })

    return {
      sales: result.sales.map(mapSaleToResponse),
      total: result.total,
      page: params?.page || 1,
      limit: params?.limit || 50,
    }
  },

  getReport: async (params?: { start_date?: string; end_date?: string }): Promise<ISaleReport> => {
    const report = await repository.getReport({
      startDate: params?.start_date ? new Date(params.start_date) : undefined,
      endDate: params?.end_date ? new Date(params.end_date) : undefined,
    })

    return {
      total_sales: report.totalSales,
      total_revenue: report.totalRevenue,
      total_tax: report.totalTax,
      total_discount: report.totalDiscount,
      average_ticket: report.averageTicket,
      sales_by_payment_method: report.salesByPaymentMethod,
      top_products: report.topProducts.map(p => ({
        product_name: p.productName,
        quantity: p.quantity,
        revenue: p.revenue,
      })),
    }
  },

  getRevenueTrend: async (params: IRevenueTrendQuery): Promise<IRevenueTrendItem[]> => {
    const items = await repository.getRevenueTrend({
      startDate: new Date(params.start_date),
      endDate: new Date(params.end_date),
      groupBy: params.group_by,
    })
    return items
  },
})
