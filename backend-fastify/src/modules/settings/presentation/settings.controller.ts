import type { FastifyReply, FastifyRequest } from "fastify"
import { createSettingsService } from "../application/settings.service"
import { SettingsRepository } from "../infrastructure/settings.prisma.repository"
import type { UpdateSettingsData } from "../domain/settings.entities"
import { UpdateSettingsDtoSchema } from "./settings.dto"

const settingsService = createSettingsService(SettingsRepository)

export const settingsController = {
  get: async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await settingsService.get()
    return reply.status(200).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = UpdateSettingsDtoSchema.parse(request.body)
    const result = await settingsService.update(data as UpdateSettingsData)
    return reply.status(200).send(result)
  },
}
