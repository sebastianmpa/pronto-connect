// ─── Query params ─────────────────────────────────────────────────────────────

export interface UsersParams {
  page?: number;
  limit?: number;
}

// ─── User record ────────────────────────────────────────────────────────────────

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  extension_number: string | null;
  zohoUserEmail: string | null;
  zohoUserId: string | null;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface UsersResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: UserItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  roleId: string;
  email: string;
  password: string;
  extension_number: string | null;
  zohoUserEmail: string | null;
  zohoUserId: string | null;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  roleId: string;
  email: string;
  /** Optional on update — omit to keep the current password. */
  password?: string;
  extension_number: string | null;
  zohoUserEmail: string | null;
  zohoUserId: string | null;
}
