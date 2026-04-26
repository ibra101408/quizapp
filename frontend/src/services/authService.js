import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/auth`;

export async function login(email, password) {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
}
export async function register(email, username, password) {
  const response = await axios.post(`${API_URL}/register`, { email, username, password });
  return response.data;
}

export async function logout() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null; 

  try {
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    localStorage.removeItem("token"); // Token was invalid, clear it
    return null;
  }
}