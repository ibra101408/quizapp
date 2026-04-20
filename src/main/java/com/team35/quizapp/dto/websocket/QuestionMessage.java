package com.team35.quizapp.dto.websocket;

import java.util.List;

public record QuestionMessage(
        Long questionId,
        String text,
        Integer timeLimit,
        Integer questionIndex,
        Integer totalQuestions,
        List<AnswerOption> answers
) {
    public record AnswerOption(Long id, String text) {}
}