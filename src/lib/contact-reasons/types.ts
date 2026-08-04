// ─── Query params ─────────────────────────────────────────────────────────────

export interface ContactReasonsParams {
  page?: number;
  limit?: number;
}

// ─── Contact reason record ──────────────────────────────────────────────────────

export interface ContactReasonItem {
  id: string;
  reasonName: string;
  internalName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Paginated response ────────────────────────────────────────────────────────

export interface ContactReasonsResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: ContactReasonItem[];
}

// ─── Create / update payloads ──────────────────────────────────────────────────

export interface CreateContactReasonPayload {
  reasonName: string;
  description: string;
}

export interface UpdateContactReasonPayload {
  reasonName: string;
  description: string;
}
