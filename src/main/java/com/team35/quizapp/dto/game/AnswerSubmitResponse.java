package com.team35.quizapp.dto.game;

public record AnswerSubmitResponse(
        boolean correct,
        int scoreAwarded,
        int totalScore
) {}
