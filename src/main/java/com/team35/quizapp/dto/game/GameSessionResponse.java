package com.team35.quizapp.dto.game;

import java.util.List;

// Response returned to the host after a game session is created.
//
// After receiving this, the host should:
//   1. Display the gamePin so players can join
//   2. Wait in the lobby until enough players have joined
//   3. Call the "start game" endpoint (future task) to begin the quiz
//
// Status will be "WAITING" at this point — the game has not started yet.
public record GameSessionResponse(
        Long sessionId,
        Integer gamePin,            // 6-digit PIN players use to join
        Long quizId,
        String quizTitle,
        String status,              // "WAITING" when first created
        Integer currentQuestionIndex,
        List<QuestionDto> questions // ordered list of questions (without correct answers)
) {
}
