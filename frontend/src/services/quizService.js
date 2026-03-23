import { getToken } from "./authService";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export async function createQuiz(quiz) {
  return axios.post(`${API_URL}/quizzes`, quiz, authHeader());
}