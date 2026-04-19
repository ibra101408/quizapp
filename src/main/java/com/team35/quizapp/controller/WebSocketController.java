package com.team35.quizapp.controller;

import com.team35.quizapp.config.WebSocketSessionCache;
import com.team35.quizapp.dto.websocket.JoinMessage;
import com.team35.quizapp.dto.websocket.PlayerListMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketSessionCache sessionCache;

    // Client sends: /app/game.join
    // Payload: { "gamePin": 123456, "nickname": "PlayerOne" }
    @MessageMapping("/game.join")
    public void joinGame(@Payload JoinMessage message,
                         SimpMessageHeaderAccessor headerAccessor) {
        String wsSessionId = headerAccessor.getSessionId();
        sessionCache.addSession(message.gamePin(), wsSessionId, message.nickname());

        log.info("Player joined: nickname={}, pin={}", message.nickname(), message.gamePin());

        // Broadcast updated player list to host
        Set<String> nicknames = sessionCache.getSessionsByPin(message.gamePin())
                .stream()
                .map(sessionCache::getNicknameBySessionId)
                .collect(Collectors.toSet());

        messagingTemplate.convertAndSend(
                "/topic/game/" + message.gamePin() + "/players",
                new PlayerListMessage(nicknames)
        );
    }
}