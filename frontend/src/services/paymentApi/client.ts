import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5201";

export const paymentApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
const getAuthToken = () => {
  const authData = JSON.parse(localStorage.getItem('sb-cvkqftzrfwmjotjhqzwa-auth-token') || '{}');
  return authData?.access_token;
};

paymentApiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  console.log("🚀 [paymentApiClient] Attaching token:", token);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
