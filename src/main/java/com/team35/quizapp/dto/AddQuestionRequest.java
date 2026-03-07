package com.team35.quizapp.dto;

import java.util.List;

public record AddQuestionRequest(String text, int orderIndex, List<AnswerOption> answers) {
}
