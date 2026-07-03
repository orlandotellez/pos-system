export interface ISettingsResponse {
  name: string
  address?: string
  phone?: string
  tax_rate: number
  low_stock_threshold: number
  ticket_footer?: string
  updated_at: string
}
