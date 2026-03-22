package com.team35.quizapp.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(

        @Schema(description = "New username (optional)", example = "andrei_updated")
        @Size(min = 3, max = 50)
        String username,

        @Schema(description = "New email address (optional)", example = "new@example.com")
        @Email
        String email
) {}
