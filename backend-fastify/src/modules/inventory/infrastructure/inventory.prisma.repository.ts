import { prisma } from "@/config/prisma"
import type { IInventoryRepository } from "../domain/inventory.interface"
import type { IInventoryMovementEntity, CreateMovementData } from "../domain/inventory.entities"
import { Prisma } from "@prisma/client"

type MovementRecord = Prisma.inventory_movementGetPayload<{ include: { product: { select: { name: true } } } }>

function mapToEntity(movement: MovementRecord): IInventoryMovementEntity {
  return {
    id: movement.id,
    product_id: movement.product_id,
    product_name: movement.product?.name || undefined,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    note: movement.note || undefined,
    batch_id: movement.batch_id || undefined,
    user_id: movement.user_id,
    created_at: movement.created_at,
  }
}

export const InventoryRepository: IInventoryRepository = {
  async create(data: CreateMovementData) {
    const movement = await prisma.inventory_movement.create({
      data: {
        product_id: data.product_id,
        movement_type: data.movement_type,
        quantity: data.quantity,
        note: data.note,
        batch_id: data.batch_id,
        user_id: data.user_id,
      },
      include: { product: { select: { name: true } } },
    })
    return mapToEntity(movement)
  },

  async findByProductId(productId: string, params) {
    const movements = await prisma.inventory_movement.findMany({
      where: { product_id: productId },
      include: { product: { select: { name: true } } },
      orderBy: { created_at: "desc" },
      take: params?.limit || 50,
    })
    return movements.map(mapToEntity)
  },

  async findAll(params) {
    const where: { product_id?: string; movement_type?: string } = {}
    if (params?.product_id) where.product_id = params.product_id
    if (params?.movement_type) where.movement_type = params.movement_type

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [rawMovements, total] = await Promise.all([
      prisma.inventory_movement.findMany({
        where,
        include: { product: { select: { name: true } } },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.inventory_movement.count({ where }),
    ])

    return {
      movements: rawMovements.map(mapToEntity),
      total,
      page,
      limit,
    }
  },
}
