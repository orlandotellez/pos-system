import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { servicesController } from "./services.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateServiceDtoSchema, UpdateServiceDtoSchema, ServiceQuerySchema } from "./services.dto"

const TAGS = ["Services"]

export const servicesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", {
    schema: { tags: TAGS, querystring: toJsonSchema(ServiceQuerySchema) },
    preHandler: [authGuard],
  }, servicesController.list)

  fastify.get("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, servicesController.getById)

  fastify.post("/", {
    schema: { tags: TAGS, body: toJsonSchema(CreateServiceDtoSchema) },
    preHandler: [authGuard],
  }, servicesController.create)

  fastify.put("/:id", {
    schema: { tags: TAGS, body: toJsonSchema(UpdateServiceDtoSchema) },
    preHandler: [authGuard],
  }, servicesController.update)

  fastify.delete("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, servicesController.delete)
}
