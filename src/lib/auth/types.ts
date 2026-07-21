// ─── Request types ───────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface AuthResponse {
  authenticated: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ─── JWT payload ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  name: string;
  email: string;
  role_id: string;
  /** Issued-at (Unix seconds) */
  iat: number;
  /** Expiration (Unix seconds) */
  exp: number;
}

// ─── Decoded user shape stored in the app ────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
  roleId: string;
}
