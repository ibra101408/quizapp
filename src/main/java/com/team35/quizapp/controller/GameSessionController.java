package com.team35.quizapp.controller;

import com.team35.quizapp.dto.game.GameSessionResponse;
import com.team35.quizapp.dto.game.StartGameRequest;
import com.team35.quizapp.entity.User;
import com.team35.quizapp.service.GameSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Game Sessions", description = "Game session management")
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class GameSessionController {

    private final GameSessionService gameSessionService;

    // POST /api/sessions
    // Creates a new game session in WAITING state.
    // Requires a valid JWT token in the Authorization header (Bearer <token>).
    //
    // Request body:  { "quizId": 1 }
    // Response:      GameSessionResponse with the generated PIN and question list
    //
    // The host should display the PIN so players can join.
    // After players have joined, call the "start game" endpoint (not yet implemented)
    // to transition the session from WAITING to IN_PROGRESS.
    @Operation(summary = "Create a game session",
               description = "Creates a new session in WAITING state. Returns a PIN for players to join.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Session created"),
            @ApiResponse(responseCode = "400", description = "Quiz has no questions"),
            @ApiResponse(responseCode = "403", description = "You do not own this quiz"),
            @ApiResponse(responseCode = "404", description = "Quiz not found")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameSessionResponse createSession(
            @RequestBody StartGameRequest request,
            // @AuthenticationPrincipal gives us the currently logged-in user.
            // This works because JwtAuthFilter parses the Bearer token from the
            // Authorization header and sets the User entity as the principal.
            // If there is no valid token, principal will be null and Spring Security
            // will reject the request before it reaches this method.
            @AuthenticationPrincipal User principal) {

        return gameSessionService.createSession(principal.getId(), request);
    }
}
