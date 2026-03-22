package com.team35.quizapp.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(

        @Schema(description = "Unique username", example = "andrei")
        @NotBlank
        @Size(min = 3, max = 50)
        String username,

        @Schema(description = "User email address", example = "andrei@example.com")
        @NotBlank
        @Email
        String email,

        @Schema(description = "Password (min 6 characters)", example = "secret123")
        @NotBlank
        @Size(min = 6)
        String password
) {}
