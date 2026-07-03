import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { usersController } from "./users.controller"
import { authGuard, adminGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserQuerySchema } from "./users.dto"

const TAGS = ["Users"]

export const usersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", {
    schema: { tags: TAGS, querystring: toJsonSchema(UserQuerySchema) },
    preHandler: [authGuard, adminGuard],
  }, usersController.list)

  fastify.get("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard, adminGuard],
  }, usersController.getById)

  fastify.post("/", {
    schema: { tags: TAGS, body: toJsonSchema(CreateUserDtoSchema) },
    preHandler: [authGuard, adminGuard],
  }, usersController.create)

  fastify.put("/:id", {
    schema: { tags: TAGS, body: toJsonSchema(UpdateUserDtoSchema) },
    preHandler: [authGuard, adminGuard],
  }, usersController.update)

  fastify.delete("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard, adminGuard],
  }, usersController.delete)
}
