package com.team35.quizapp.controller;

import com.team35.quizapp.service.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Players", description = "Player management")
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @Operation(summary = "Kick a player from the game session")
    @DeleteMapping("/{gamePin}/players/{nickname}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void kickPlayer(@PathVariable Integer gamePin,
                           @PathVariable String nickname) {
        playerService.kickPlayer(gamePin, nickname);
    }
}