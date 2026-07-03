import type { Role } from "@/types/auth"

export interface IRegisterPayload {
  name: string
  email: string
  password: string
  role?: Role
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface IVerifyEmailPayload {
  identifier: string
  code: string
}

export interface IForgotPasswordPayload {
  email: string
}

export interface IResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

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

export interface IAuthResponse {
  message: string
  user: IUserResponse
  accessToken: string
  refreshToken: string
}

export interface IRefreshResponse {
  message: string
  user: IUserResponse
  accessToken: string
  refreshToken: string
}

export interface IVerificationResponse {
  message: string
  expiresAt: Date
}

export interface ILogoutResponse {
  message: string
}

export interface ISessionResponse {
  id: string
  expires_at: Date
  ip_address?: string
  user_agent?: string
  created_at: Date
  updated_at: Date
}

export interface IUserSessionsResponse {
  sessions: ISessionResponse[]
}

export interface IVerifyEmailResponse {
  message: string
  accessToken: string
  refreshToken: string
}

export interface IForgotPasswordResponse {
  message: string
  expires_at: Date
}

export interface IResetPasswordResponse {
  message: string
}
