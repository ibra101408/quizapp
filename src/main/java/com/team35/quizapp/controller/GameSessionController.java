package com.team35.quizapp.controller;

import com.team35.quizapp.dto.game.AnswerSubmitResponse;
import com.team35.quizapp.dto.game.GameSessionResponse;
import com.team35.quizapp.dto.game.StartGameRequest;
import com.team35.quizapp.dto.game.SubmitAnswerRequest;
import com.team35.quizapp.service.GameSessionService;
import com.team35.quizapp.service.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class GameSessionController {

    private final GameSessionService gameSessionService;
    private final PlayerService playerService;

    @Operation(summary = "Create a new game session")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameSessionResponse createSession(@RequestBody StartGameRequest request) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        return gameSessionService.createSession(request, email);
    }

    @Operation(summary = "Start a game session")
    @PutMapping("/{gamePin}/start")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void startGame(@PathVariable Integer gamePin) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        gameSessionService.startGame(gamePin, email);
    }

    @Operation(summary = "Submit a player answer")
    @PostMapping("/{gamePin}/answer")
    public AnswerSubmitResponse submitAnswer(@PathVariable Integer gamePin,
                                             @RequestBody SubmitAnswerRequest request) {
        return playerService.submitAnswer(gamePin, request);
    }

    @Operation(summary = "End current question and broadcast results")
    @PutMapping("/{gamePin}/end-question")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void endQuestion(@PathVariable Integer gamePin) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        gameSessionService.endQuestion(gamePin, email);
    }

    @Operation(summary = "Advance to next question")
    @PutMapping("/{gamePin}/next-question")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void nextQuestion(@PathVariable Integer gamePin) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        gameSessionService.nextQuestion(gamePin, email);
    }

    @Operation(summary = "End the game session")
    @PutMapping("/{gamePin}/end-game")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void endGame(@PathVariable Integer gamePin) {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        gameSessionService.endGame(gamePin, email);
    }
}
