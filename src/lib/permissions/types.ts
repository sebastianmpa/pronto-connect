// ─── Query params ─────────────────────────────────────────────────────────────

export interface PermissionsParams {
  page?: number;
  limit?: number;
}

// ─── Permission record ─────────────────────────────────────────────────────────

export interface PermissionItem {
  id: string;
  name: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface PermissionsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: PermissionItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────
// Note: unlike other atc modules, the permission's internal name is caller-supplied
// (snake_case `internal_name` in the request body) rather than server-generated.

export interface CreatePermissionPayload {
  name: string;
  internal_name: string;
  description: string;
}

export interface UpdatePermissionPayload {
  name: string;
  internal_name: string;
  description: string;
}
