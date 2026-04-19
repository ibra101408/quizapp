package com.team35.quizapp.service;

import com.team35.quizapp.config.WebSocketSessionCache;
import com.team35.quizapp.controller.WebSocketController;
import com.team35.quizapp.entity.Player;
import com.team35.quizapp.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final WebSocketSessionCache sessionCache;
    private final WebSocketController webSocketController;

    public void kickPlayer(Integer gamePin, String nickname) {
        Player player = playerRepository.findByGameSessionGamePinAndNickname(gamePin, nickname)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));

        // Mark as kicked in DB
        player.setIsKicked(true);
        playerRepository.save(player);
        log.info("Player kicked: nickname={}, pin={}", nickname, gamePin);

        // Remove from session cache
        String wsSessionId = sessionCache.getSessionIdByNickname(gamePin, nickname);
        if (wsSessionId != null) {
            sessionCache.markDisconnected(wsSessionId);
        }

        // Broadcast kicked event to the player
        webSocketController.broadcastKick(gamePin, nickname);

        // Broadcast updated player list to host
        webSocketController.broadcastPlayerList(gamePin);
    }
}