import type {
  IUserEntity,
  IAccountEntity,
  ISessionEntity,
  IVerificationEntity,
  CreateUserData,
  UpdateUserData,
  CreateAccountData,
  CreateSessionData,
  CreateVerificationData
} from "./auth.entities"

export interface IUserRepository {
  findByEmail(email: string): Promise<IUserEntity | null>
  findById(id: string): Promise<IUserEntity | null>
  create(data: CreateUserData): Promise<IUserEntity>
  update(id: string, data: UpdateUserData): Promise<IUserEntity>
  softDelete(id: string): Promise<void>
}

export interface IAccountRepository {
  findByProviderAndAccountId(providerId: string, accountId: string): Promise<IAccountEntity | null>
  findByUserId(userId: string): Promise<IAccountEntity[]>
  findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null>
  create(data: CreateAccountData): Promise<IAccountEntity>
  update(id: string, data: Partial<CreateAccountData>): Promise<IAccountEntity>
  delete(id: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<ISessionEntity>
  findByToken(token: string): Promise<ISessionEntity | null>
  findByUserId(userId: string): Promise<ISessionEntity[]>
  delete(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpiredSessions(): Promise<number>
}

export interface IVerificationRepository {
  create(data: CreateVerificationData): Promise<IVerificationEntity>
  findByIdentifier(identifier: string): Promise<IVerificationEntity | null>
  findByIdentifierAndValue(identifier: string, value: string): Promise<IVerificationEntity | null>
  delete(id: string): Promise<void>
  deleteByIdentifier(identifier: string): Promise<void>
  deleteExpired(): Promise<number>
}

export interface IAuthRepository {
  user: IUserRepository
  account: IAccountRepository
  session: ISessionRepository
  verification: IVerificationRepository
}
