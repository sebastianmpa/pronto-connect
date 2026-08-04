// ─── Query params ─────────────────────────────────────────────────────────────

export interface RolesParams {
  page?: number;
  limit?: number;
}

// ─── Role record ────────────────────────────────────────────────────────────────

export interface RoleItem {
  id: string;
  name: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface RolesResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: RoleItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────
// Note: like permissions, the role's internal name is caller-supplied — but here
// the request body uses camelCase `internalName` rather than snake_case.

export interface CreateRolePayload {
  name: string;
  description: string;
  internalName: string;
}

export interface UpdateRolePayload {
  name: string;
  description: string;
  internalName: string;
}

// ─── Role ⇄ permission assignment ──────────────────────────────────────────────

export interface RolePermissionPivot {
  createdAt: string;
  updatedAt: string;
  PermissionId: string;
  RoleId: string;
}

export interface RolePermissionItem {
  id: string;
  name: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  role_permissions?: RolePermissionPivot;
}

export interface SetRolePermissionsPayload {
  permission_ids: string[];
}
