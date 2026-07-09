import type { FastifyReply, FastifyRequest } from "fastify"
import { createSaleService } from "../application/sales.service"
import { SaleRepository } from "../infrastructure/sales.prisma.repository"
import { CreateSaleDtoSchema, SaleQuerySchema, ReportQuerySchema, RevenueTrendQuerySchema } from "./sales.dto"
import { UnauthorizedError } from "@/core/errors/AppError"

const saleService = createSaleService(SaleRepository)

export const salesController = {
  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId
    const storeId = request.storeId
    if (!userId) throw new UnauthorizedError("Authentication required")

    const data = CreateSaleDtoSchema.parse(request.body)
    const result = await saleService.create({ ...data, user_id: userId }, storeId!)
    return reply.status(201).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const storeId = request.storeId
    const result = await saleService.getById(id, storeId!)
    return reply.status(200).send(result)
  },

  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const storeId = request.storeId
    const query = SaleQuerySchema.parse(request.query)
    const result = await saleService.list({ ...query, storeId })
    return reply.status(200).send(result)
  },

  report: async (request: FastifyRequest, reply: FastifyReply) => {
    const storeId = request.storeId
    const query = ReportQuerySchema.parse(request.query)
    const result = await saleService.getReport({ ...query, storeId })
    return reply.status(200).send(result)
  },

  revenueTrend: async (request: FastifyRequest, reply: FastifyReply) => {
    const storeId = request.storeId
    const query = RevenueTrendQuerySchema.parse(request.query)
    const result = await saleService.getRevenueTrend({ ...query, store_id: storeId! })
    return reply.status(200).send(result)
  },
}
