import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { settingsController } from "./settings.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { UpdateSettingsDtoSchema } from "./settings.dto"

const TAGS = ["Settings"]

export const settingsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", {
    schema: { tags: TAGS },
    preHandler: [authGuard],
  }, settingsController.get)

  fastify.put("/", {
    schema: { tags: TAGS, body: toJsonSchema(UpdateSettingsDtoSchema) },
    preHandler: [authGuard],
  }, settingsController.update)
}
