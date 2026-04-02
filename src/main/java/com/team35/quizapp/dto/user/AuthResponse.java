package com.team35.quizapp.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;

public record AuthResponse(
    @Schema(description = "The JWT access token", example = "eyJhbGciOiJIUzI1NiJ...")
    String token,

    @Schema(description = "Type of token", example = "Bearer")
    String type
) {
    // A convenient constructor if you just want to pass the token
    public AuthResponse(String token) {
        this(token, "Bearer");
    }
}