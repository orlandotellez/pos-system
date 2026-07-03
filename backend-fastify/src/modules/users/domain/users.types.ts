import type { Role } from "@/types/auth"

export interface IUserResponse {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string
  image?: string
  created_at: Date
  updated_at: Date
}

export interface IUserListResponse {
  users: IUserResponse[]
  total: number
  page: number
  limit: number
}
