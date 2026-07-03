export interface ISupplierEntity {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export type CreateSupplierData = {
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active?: boolean
}

export type UpdateSupplierData = Partial<CreateSupplierData>
