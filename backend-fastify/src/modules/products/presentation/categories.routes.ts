import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { categoriesController } from "./categories.controller"

const TAGS = ["Categories"]

export const categoriesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { schema: { tags: TAGS } }, categoriesController.list)
}
