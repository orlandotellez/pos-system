import { prisma } from "@/config/prisma"
import type { ISettingsRepository } from "../domain/settings.interface"
import type { ISettingsEntity, UpdateSettingsData } from "../domain/settings.entities"
import type { settings } from "@prisma/client"

function mapToEntity(settings: settings): ISettingsEntity {
  return {
    id: settings.id,
    name: settings.name,
    address: settings.address || undefined,
    phone: settings.phone || undefined,
    tax_rate: settings.tax_rate,
    low_stock_threshold: settings.low_stock_threshold,
    ticket_footer: settings.ticket_footer || undefined,
    updated_at: settings.updated_at,
  }
}

export const SettingsRepository: ISettingsRepository = {
  async get() {
    const settings = await prisma.settings.findFirst()
    if (!settings) return null
    return mapToEntity(settings)
  },

  async upsert(data: UpdateSettingsData) {
    const existing = await prisma.settings.findFirst()

    if (existing) {
      const updated = await prisma.settings.update({
        where: { id: existing.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.tax_rate !== undefined && { tax_rate: data.tax_rate }),
          ...(data.low_stock_threshold !== undefined && { low_stock_threshold: data.low_stock_threshold }),
          ...(data.ticket_footer !== undefined && { ticket_footer: data.ticket_footer }),
        },
      })
      return mapToEntity(updated)
    }

    const created = await prisma.settings.create({
      data: {
        name: data.name ?? "Mi Negocio",
        address: data.address,
        phone: data.phone,
        tax_rate: data.tax_rate ?? 16,
        low_stock_threshold: data.low_stock_threshold ?? 5,
        ticket_footer: data.ticket_footer,
      },
    })
    return mapToEntity(created)
  },
}
