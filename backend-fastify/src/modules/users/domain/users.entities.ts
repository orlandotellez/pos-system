import type { ROLE } from "@prisma/client"

export interface IUserEntity {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: ROLE
  phone?: string | null
  image?: string | null
  store_id?: string | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: ROLE
  phone?: string
  store_id?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: ROLE
  phone?: string
}
