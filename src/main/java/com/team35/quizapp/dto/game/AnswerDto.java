package com.team35.quizapp.dto.game;

// Represents one answer option sent to the client.
//
// IMPORTANT: isCorrect is intentionally NOT included here.
// Sending the correct answer to the client would allow players to cheat
// by inspecting the API response. Correct answers are only revealed
// through a separate "reveal" endpoint after the question time window closes.
public record AnswerDto(
        Long id,
        String text
) {
}
