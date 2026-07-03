import { z } from "zod"

export const CreateMovementDtoSchema = z.object({
  product_id: z.string().uuid(),
  movement_type: z.enum(["entrada", "salida", "ajuste"]),
  quantity: z.number().int(),
  note: z.string().optional(),
  batch_id: z.string().uuid().optional(),
})

export const MovementQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  movement_type: z.enum(["entrada", "salida", "ajuste", "venta"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateMovementDto = z.infer<typeof CreateMovementDtoSchema>
export type MovementQueryDto = z.infer<typeof MovementQuerySchema>
