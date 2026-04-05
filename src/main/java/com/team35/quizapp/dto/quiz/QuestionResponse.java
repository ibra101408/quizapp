package com.team35.quizapp.dto.quiz;

import java.util.List;

public record QuestionResponse(
    Long id,
    String text,
    Integer timeLimit,
    List<AnswerResponse> answers
) {}