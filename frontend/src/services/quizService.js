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
  console.log("what is quiz", quiz);
  return axios.post(`${API_URL}/quizzes`, quiz, authHeader());
}

export async function deleteQuiz(id) {
  return axios.delete(`${API_URL}/quizzes/${id}`, authHeader());
}

export const createSession = async (quizId) => {
  const response = await axios.post(`${API_URL}/sessions`, { quizId }, authHeader());
  return response.data; // returns the object with gamePin and sessionId
};