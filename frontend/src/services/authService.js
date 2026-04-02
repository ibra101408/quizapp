import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

export async function login(email, password) {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
}
export async function register(email, username, password) {
  console.log("Registration:", { email, username, password }); // Debug log
  const response = await axios.post(`${API_URL}/register`, { email, username, password });
  console.log("Registration111:", response.data); // Debug log
  return response.data;
}

export async function logout() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}