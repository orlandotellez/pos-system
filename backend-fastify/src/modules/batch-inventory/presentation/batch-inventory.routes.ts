import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { batchInventoryController } from "./batch-inventory.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateBatchDtoSchema, BatchQuerySchema } from "./batch-inventory.dto"

const TAGS = ["Inventory Batches"]

export const batchInventoryRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", {
    schema: { tags: TAGS, querystring: toJsonSchema(BatchQuerySchema) },
    preHandler: [authGuard],
  }, batchInventoryController.list)

  fastify.get("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, batchInventoryController.getById)

  fastify.post("/", {
    schema: { tags: TAGS, body: toJsonSchema(CreateBatchDtoSchema) },
    preHandler: [authGuard],
  }, batchInventoryController.create)
}
