import { getToken } from "./authService";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export const getMyQuizzes = async () => {
  const response = await axios.get(`${API_URL}/quizzes`, authHeader());
  return response;
};

export async function createQuiz(quiz) {
  return axios.post(`${API_URL}/quizzes`, quiz, authHeader());
}

export async function updateQuiz(id, quiz) {
  return axios.put(`${API_URL}/quizzes/${id}`, quiz, authHeader());
}

export async function deleteQuiz(id) {
  return axios.delete(`${API_URL}/quizzes/${id}`, authHeader());
}

export const createSession = async (quizId) => {
  const response = await axios.post(`${API_URL}/sessions`, { quizId }, authHeader());
  return response.data;
};
