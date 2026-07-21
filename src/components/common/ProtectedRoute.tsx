import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "../../store/authStore";

/**
 * Wraps protected layouts. Redirects to /atc-signin if the token
 * is missing or has expired.
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/atc-signin" replace />;
}
