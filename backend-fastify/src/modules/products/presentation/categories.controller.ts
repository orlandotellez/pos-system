import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "@/config/prisma"

export const categoriesController = {
  list: async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.category.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    })
    return reply.status(200).send(categories)
  },
}
