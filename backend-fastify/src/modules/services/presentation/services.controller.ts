import type { FastifyReply, FastifyRequest } from "fastify"
import { createServiceService } from "../application/services.service"
import { ServiceRepository } from "../infrastructure/services.prisma.repository"
import { CreateServiceDtoSchema, UpdateServiceDtoSchema, ServiceQuerySchema } from "./services.dto"

const serviceService = createServiceService(ServiceRepository)

export const servicesController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ServiceQuerySchema.parse(request.query)
    const result = await serviceService.list(query)
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await serviceService.getById(id)
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateServiceDtoSchema.parse(request.body)
    const result = await serviceService.create(data)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateServiceDtoSchema.parse(request.body)
    const result = await serviceService.update(id, data)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await serviceService.delete(id)
    return reply.status(200).send({ message: "Service deleted successfully" })
  },
}
