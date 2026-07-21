import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import apiClient from "../lib/apiClient";

// Token keys in localStorage
export const ATC_TOKEN_KEY = "access_token";
export const TOKEN_TYPE_KEY = "token_type";

type AuthType = "atc" | "customer" | null;

interface AuthContextValue {
  authType: AuthType;
  isAuthenticated: boolean;
  loginAtc: (email: string, password: string) => Promise<void>;
  loginCustomer: (email: string, purchaseOrder: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authType, setAuthType] = useState<AuthType>(() => {
    const token = localStorage.getItem(ATC_TOKEN_KEY);
    const type = localStorage.getItem(TOKEN_TYPE_KEY) as AuthType;
    return token ? type : null;
  });

  const navigate = useNavigate();

  const saveToken = useCallback((token: string, type: AuthType) => {
    localStorage.setItem(ATC_TOKEN_KEY, token);
    localStorage.setItem(TOKEN_TYPE_KEY, type ?? "");
    setAuthType(type);
  }, []);

  const loginAtc = useCallback(
    async (email: string, password: string) => {
      const { data } = await apiClient.post("/atc-auth/atc/v0/access-token", {
        email,
        password,
      });
      // API returns { access_token: "...", ... } or similar — adjust key if needed
      const token: string = data.access_token ?? data.token ?? data.accessToken;
      saveToken(token, "atc");
      navigate("/");
    },
    [saveToken, navigate]
  );

  const loginCustomer = useCallback(
    async (email: string, purchaseOrder: string) => {
      const { data } = await apiClient.post(
        "/customer-auth/v0/access-token",
        {
          email,
          purchase_order: purchaseOrder,
        }
      );
      const token: string = data.access_token ?? data.token ?? data.accessToken;
      saveToken(token, "customer");
      navigate("/");
    },
    [saveToken, navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ATC_TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
    setAuthType(null);
    navigate("/atc-signin");
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        authType,
        isAuthenticated: authType !== null,
        loginAtc,
        loginCustomer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
