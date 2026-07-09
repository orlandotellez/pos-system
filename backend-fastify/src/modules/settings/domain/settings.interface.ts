import type { ISettingsEntity, UpdateSettingsData } from "./settings.entities"

export interface ISettingsRepository {
  get(storeId: string): Promise<ISettingsEntity | null>
  upsert(data: UpdateSettingsData, storeId: string): Promise<ISettingsEntity>
}
