package com.team35.quizapp.dto.quiz;

public record CreateAnswerRequest(
    String text,
    Boolean isCorrect
) {}