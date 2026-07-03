import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { salesController } from "./sales.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateSaleDtoSchema, SaleQuerySchema, ReportQuerySchema, RevenueTrendQuerySchema } from "./sales.dto"

const TAGS = ["Sales"]

export const salesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/report", {
    schema: { tags: TAGS, querystring: toJsonSchema(ReportQuerySchema) },
    preHandler: [authGuard],
  }, salesController.report)

  fastify.get("/revenue-trend", {
    schema: { tags: TAGS, querystring: toJsonSchema(RevenueTrendQuerySchema) },
    preHandler: [authGuard],
  }, salesController.revenueTrend)

  fastify.get("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, salesController.getById)

  fastify.get("/", {
    schema: { tags: TAGS, querystring: toJsonSchema(SaleQuerySchema) },
    preHandler: [authGuard],
  }, salesController.list)

  fastify.post("/", {
    schema: { tags: TAGS, body: toJsonSchema(CreateSaleDtoSchema) },
    preHandler: [authGuard],
  }, salesController.create)
}
