import type { ISettingsEntity, UpdateSettingsData } from "./settings.entities"

export interface ISettingsRepository {
  get(): Promise<ISettingsEntity | null>
  upsert(data: UpdateSettingsData): Promise<ISettingsEntity>
}
