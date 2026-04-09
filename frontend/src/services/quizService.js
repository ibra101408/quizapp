import { getToken } from "./authService";
import axios from "axios";

const API_URL = "http://localhost:8080/api";
const authHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export const getMyQuizzes = async () => {
  const response = await axios.get(`${API_URL}/quizzes/my-quizzes`, authHeader());
  return response.data;
};

export async function createQuiz(quiz) {
  console.log("what is quiz", quiz);
  return axios.post(`${API_URL}/quizzes`, quiz, authHeader());
}

export async function deleteQuiz(id) {
  return axios.delete(`${API_URL}/quizzes/${id}`, authHeader());
}