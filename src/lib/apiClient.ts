import axios from "axios";
// Imported via getState() to avoid circular deps — authStore does not import apiClient
import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL as string;
const IDEAL_API_URL = import.meta.env.VITE_IDEAL_API_URL as string;
const IDEAL_API_KEY = import.meta.env.VITE_IDEAL_API_KEY as string;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach token from the auth store to every request
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — on 401 clear the session and let ProtectedRoute redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// Separate client for Ideal Data Service.
// This endpoint uses its own base URL and x-api-key instead of the ATC JWT.
export const idealApiClient = axios.create({
  baseURL: IDEAL_API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-key": IDEAL_API_KEY,
  },
});

export default apiClient;
