package com.team35.quizapp.dto.quiz;

public record AnswerResponse(
    Long id,
    String text,
    Boolean isCorrect
) {}