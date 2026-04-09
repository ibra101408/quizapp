import { getToken } from "./authService";
import axios from "axios";

const API_URL = "http://localhost:8080/api/quizzes";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export const getMyQuizzes = async () => {
  const response = await axios.get(`${API_URL}/my-quizzes`, authHeader());
  return response.data;
};

export async function createQuiz(quiz) {
  return axios.post(`${API_URL}/quizzes`, quiz, authHeader());
}
