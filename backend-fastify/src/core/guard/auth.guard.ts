import type { FastifyReply, FastifyRequest } from "fastify"
import type { Role } from "@/types/auth"
import { UnauthorizedError, ForbiddenError } from "@/core/errors/AppError"
import { getUserIdFromCookies, getUserIdFromBearerToken } from "../utils/auth.utils"

declare module "fastify" {
  interface FastifyRequest {
    userId?: string
    userRole?: Role
  }
}

export const authGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const fromCookies = getUserIdFromCookies(request)
  const fromBearer = getUserIdFromBearerToken(request)

  const { userId, role } = fromCookies.userId ? fromCookies : fromBearer

  if (!userId) {
    throw new UnauthorizedError("Authentication required")
  }

  request.userId = userId
  request.userRole = role ?? undefined
}

export const adminGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  if (request.userRole !== "admin") {
    throw new ForbiddenError("Admin access required")
  }
}
