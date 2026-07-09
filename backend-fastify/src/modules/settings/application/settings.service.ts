import type { ISettingsRepository } from "../domain/settings.interface"
import type { ISettingsResponse } from "../domain/settings.types"
import type { UpdateSettingsData, ISettingsEntity } from "../domain/settings.entities"

function mapSettingsToResponse(settings: ISettingsEntity): ISettingsResponse {
  return {
    name: settings.name,
    address: settings.address || undefined,
    phone: settings.phone || undefined,
    tax_rate: Number(settings.tax_rate),
    low_stock_threshold: settings.low_stock_threshold,
    ticket_footer: settings.ticket_footer || undefined,
    updated_at: settings.updated_at instanceof Date ? settings.updated_at.toISOString() : settings.updated_at,
  }
}

export const createSettingsService = (repository: ISettingsRepository) => ({
  get: async (storeId: string): Promise<ISettingsResponse> => {
    const settings = await repository.get(storeId)
    if (!settings) {
      return {
        name: "",
        tax_rate: 16,
        low_stock_threshold: 5,
        updated_at: new Date().toISOString(),
      }
    }
    return mapSettingsToResponse(settings)
  },

  update: async (data: UpdateSettingsData, storeId: string): Promise<ISettingsResponse> => {
    const settings = await repository.upsert(data, storeId)
    return mapSettingsToResponse(settings)
  },
})
