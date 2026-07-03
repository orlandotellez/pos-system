import { prisma } from "@/config/prisma"
import type { IBatchInventoryRepository } from "../domain/batch-inventory.interface"
import type { IBatchEntity, IBatchItemEntity, CreateBatchData, CreateBatchItemData } from "../domain/batch-inventory.entities"
import { Prisma } from "@prisma/client"

const batchItemInclude = {
  product: { select: { name: true } },
} as const

type BatchItemRecord = Prisma.inventory_batch_itemGetPayload<{ include: typeof batchItemInclude }>
type BatchRecord = Prisma.inventory_batchGetPayload<{ include: { items: { include: typeof batchItemInclude }; supplier: { select: { name: true } }; user: { select: { name: true } } } }>

function mapItemToEntity(item: BatchItemRecord): IBatchItemEntity {
  return {
    id: item.id,
    batch_id: item.batch_id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost ? Number(item.unit_cost) : null,
    notes: item.notes || null,
    created_at: item.created_at,
  }
}

function mapToEntity(batch: BatchRecord): IBatchEntity {
  return {
    id: batch.id,
    movement_type: batch.movement_type,
    supplier_id: batch.supplier_id || null,
    notes: batch.notes || null,
    user_id: batch.user_id,
    created_at: batch.created_at,
    items: (batch.items || []).map(mapItemToEntity),
  }
}

export const BatchInventoryRepository: IBatchInventoryRepository = {
  async create(data: CreateBatchData) {
    const batch = await prisma.inventory_batch.create({
      data: {
        movement_type: data.movement_type,
        supplier_id: data.supplier_id,
        notes: data.notes,
        user_id: data.user_id,
        items: {
          create: data.items.map((item: CreateBatchItemData) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        supplier: { select: { name: true } },
        user: { select: { name: true } },
      },
    })
    return mapToEntity(batch as unknown as BatchRecord)
  },

  async findById(id: string) {
    const batch = await prisma.inventory_batch.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        supplier: { select: { name: true } },
        user: { select: { name: true } },
      },
    })
    if (!batch) return null
    return mapToEntity(batch)
  },

  async findAll(params) {
    const where: { movement_type?: string; supplier_id?: string } = {}
    if (params?.movement_type) where.movement_type = params.movement_type
    if (params?.supplier_id) where.supplier_id = params.supplier_id

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [rawBatches, total] = await Promise.all([
      prisma.inventory_batch.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
          supplier: { select: { name: true } },
          user: { select: { name: true } },
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.inventory_batch.count({ where }),
    ])

    return {
      batches: rawBatches.map(mapToEntity),
      total,
      page,
      limit,
    }
  },
}
