package com.team35.quizapp.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final WebSocketSessionCache sessionCache;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String wsSessionId = event.getSessionId();
        Integer gamePin = sessionCache.getPinBySessionId(wsSessionId);
        String nickname = sessionCache.getNicknameBySessionId(wsSessionId);

        if (gamePin != null) {
            sessionCache.markDisconnected(wsSessionId);
            log.info("Player disconnected: nickname={}, pin={}", nickname, gamePin);

            // Broadcast updated player list
            Set<String> nicknames = sessionCache.getSessionsByPin(gamePin)
                    .stream()
                    .map(sessionCache::getNicknameBySessionId)
                    .collect(Collectors.toSet());

            messagingTemplate.convertAndSend(
                    "/topic/game/" + gamePin + "/players",
                    nicknames
            );
        }
    }
}