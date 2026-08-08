export type UserRole = 'OWNER' | 'MANAGER' | 'ADMIN' | 'MEMBER'

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'

export type UserGender = 'UNKNOWN' | 'FEMALE' | 'MALE'

export type UserTheme =
  | 'NAVY'
  | 'TEAL'
  | 'BLUE'
  | 'PURPLE'
  | 'FOREST'
  | 'WINE'
  | 'SLATE'
  | 'COFFEE'
  | 'ROSE'
  | 'INDIGO'
  | 'OLIVE'
  | 'RUST'

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type AccessState =
  | 'UNAPPLIED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISABLED'

export interface UserRecord {
  _id: string
  openid: string
  display_name: string
  avatar_url?: string
  gender?: UserGender
  theme?: UserTheme
  role: UserRole
  status: UserStatus
  joined_at?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface JoinRequestRecord {
  _id: string
  applicant_id: string
  display_name: string
  requested_role: 'ADMIN' | 'MEMBER'
  approved_role?: 'ADMIN' | 'MEMBER'
  status: JoinRequestStatus
  review_comment?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface PublicUser {
  id: string
  displayName: string
  avatarUrl?: string
  gender: UserGender
  theme: UserTheme
  role: UserRole
  status: UserStatus
  joinedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  user: PublicUser
  accessState: AccessState
}

export interface PendingJoinRequest {
  id: string
  applicant: PublicUser
  displayName: string
  requestedRole: 'ADMIN' | 'MEMBER'
  approvedRole?: 'ADMIN' | 'MEMBER'
  createdAt: string
}

export interface PublicMember extends PublicUser {
  reviewedBy?: string
  reviewedAt?: string
}
