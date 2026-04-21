package com.team35.quizapp.dto.game;

public record SubmitAnswerRequest(
        String nickname,
        Long questionId,
        Long answerId
) {}