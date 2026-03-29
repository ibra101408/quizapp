import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export async function login(email, password) {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data; // expects { token: "..." }
}
export async function register(email, password) {
  const response = await axios.post(`${API_URL}/register`, { email, password });
  return response.data; // expects { token: "..." }
}

export async function logout() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

export async function getCurrentUser() {
  try {
    const response = await axios.get(`${API_URL}/me`, { withCredentials: true });
    return response.data;
  } catch (error) {
    return null;
  }
}