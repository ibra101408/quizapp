package com.team35.quizapp.dto.quiz;

import java.util.List;

public record CreateQuestionRequest(
    String text,
    Integer timeLimit,
    String imageUrl,
    List<CreateAnswerRequest> answers
) {}