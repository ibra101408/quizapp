package com.team35.quizapp.dto.user;

import com.team35.quizapp.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record UserResponse(
        @Schema(description = "User ID") Long id,
        @Schema(description = "Username") String username,
        @Schema(description = "Email address") String email,
        @Schema(description = "Account creation timestamp") LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }
}
