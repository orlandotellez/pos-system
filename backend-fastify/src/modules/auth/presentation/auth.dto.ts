import { z } from "zod"

export const RegisterPayloadDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "cajero"]).optional()
})

export const LoginPayloadDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const VerifyEmailDtoSchema = z.object({
  identifier: z.string().email("Invalid email format"),
  code: z.string().min(6, "Verification code must be at least 6 characters")
})

export const ResendVerificationDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ResetPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
})

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
})

export const RevokeSessionDtoSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID")
})

export type RegisterPayloadDto = z.infer<typeof RegisterPayloadDtoSchema>
export type LoginPayloadDto = z.infer<typeof LoginPayloadDtoSchema>
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>
export type ResendVerificationDto = z.infer<typeof ResendVerificationDtoSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>
export type RevokeSessionDto = z.infer<typeof RevokeSessionDtoSchema>
