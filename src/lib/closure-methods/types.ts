// ─── Query params ─────────────────────────────────────────────────────────────

export interface ClosureMethodsParams {
  page?: number;
  limit?: number;
}

// ─── Closure method record ─────────────────────────────────────────────────────

export interface ClosureMethodItem {
  id: string;
  methodName: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface ClosureMethodsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: ClosureMethodItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────

export interface CreateClosureMethodPayload {
  methodName: string;
  description: string;
}

export interface UpdateClosureMethodPayload {
  methodName: string;
  description: string;
}
