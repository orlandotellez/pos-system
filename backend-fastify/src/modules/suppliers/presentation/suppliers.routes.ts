import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { suppliersController } from "./suppliers.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateSupplierDtoSchema, UpdateSupplierDtoSchema, SupplierQuerySchema } from "./suppliers.dto"

const TAGS = ["Suppliers"]

export const suppliersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", {
    schema: { tags: TAGS, querystring: toJsonSchema(SupplierQuerySchema) },
    preHandler: [authGuard],
  }, suppliersController.list)

  fastify.get("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, suppliersController.getById)

  fastify.post("/", {
    schema: { tags: TAGS, body: toJsonSchema(CreateSupplierDtoSchema) },
    preHandler: [authGuard],
  }, suppliersController.create)

  fastify.put("/:id", {
    schema: { tags: TAGS, body: toJsonSchema(UpdateSupplierDtoSchema) },
    preHandler: [authGuard],
  }, suppliersController.update)

  fastify.delete("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, suppliersController.delete)
}
