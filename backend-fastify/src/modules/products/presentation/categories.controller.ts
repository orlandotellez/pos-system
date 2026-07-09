import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "@/config/prisma"

export const categoriesController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.category.findMany({
      where: {
        deleted_at: null,
        ...(request.storeId ? { store_id: request.storeId } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    })
    return reply.status(200).send(categories)
  },
}
