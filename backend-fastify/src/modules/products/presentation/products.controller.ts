import type { FastifyReply, FastifyRequest } from "fastify"
import { createProductService } from "../application/products.service"
import { ProductRepository } from "../infrastructure/products.prisma.repository"
import type { UpdateProductData } from "../domain/products.entities"
import { CreateProductDtoSchema, UpdateProductDtoSchema, ProductQuerySchema } from "./products.dto"
import { BadRequestError } from "@/core/errors/AppError"

const productService = createProductService(ProductRepository)

export const productsController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ProductQuerySchema.parse(request.query)
    const result = await productService.list({
      search: query.search,
      category_id: query.category_id,
      active: query.active,
      lowStock: query.low_stock,
      outOfStock: query.out_of_stock,
      page: query.page,
      limit: query.limit,
    })
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await productService.getById(id)
    return reply.status(200).send(result)
  },

  getByBarcode: async (request: FastifyRequest, reply: FastifyReply) => {
    const { barcode } = request.params as { barcode: string }
    const result = await productService.getByBarcode(barcode)
    if (!result) {
      return reply.status(404).send({ message: "Product not found" })
    }
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateProductDtoSchema.parse(request.body)
    const result = await productService.create(data)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateProductDtoSchema.parse(request.body)
    const result = await productService.update(id, data as UpdateProductData)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await productService.delete(id)
    return reply.status(200).send({ message: "Product deleted successfully" })
  },
}
