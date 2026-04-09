package com.team35.quizapp.dto.game;

import java.util.List;

// Represents one question sent to the client.
// Questions are ordered by their order_index from the session_question table,
// which was set when the session was created.
public record QuestionDto(
        Long id,
        String text,
        Integer timeLimit,   // seconds the player has to answer (set per question when creating the quiz)
        List<AnswerDto> answers
) {
}
