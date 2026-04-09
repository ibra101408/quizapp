package com.team35.quizapp.dto.game;

// Request body sent by the host when creating a new game session.
// The host only needs to tell us which quiz to use — their identity
// comes from the JWT token, not from this request.
public record StartGameRequest(Long quizId) {
}
