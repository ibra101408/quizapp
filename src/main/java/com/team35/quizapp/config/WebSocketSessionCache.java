package com.team35.quizapp.config;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionCache {

    // gamePin -> Set of WebSocket session IDs connected to that game
    private final Map<Integer, Set<String>> sessionsByPin = new ConcurrentHashMap<>();

    // WebSocket session ID -> gamePin
    private final Map<String, Integer> pinBySessionId = new ConcurrentHashMap<>();

    // WebSocket session ID -> nickname
    private final Map<String, String> nicknameBySessionId = new ConcurrentHashMap<>();

    // gamePin -> nickname -> last known WebSocket session ID (for reconnect)
    private final Map<Integer, Map<String, String>> reconnectMap = new ConcurrentHashMap<>();

    // gamePin -> nickname -> connected status
    private final Map<Integer, Map<String, Boolean>> connectionStatus = new ConcurrentHashMap<>();

    public void addSession(Integer gamePin, String wsSessionId, String nickname) {
        // Check if this is a reconnect
        Map<String, String> pinReconnectMap = reconnectMap.computeIfAbsent(gamePin, k -> new ConcurrentHashMap<>());
        String oldSessionId = pinReconnectMap.get(nickname);
        if (oldSessionId != null) {
            // Remove old session ID mappings
            sessionsByPin.getOrDefault(gamePin, ConcurrentHashMap.newKeySet()).remove(oldSessionId);
            pinBySessionId.remove(oldSessionId);
            nicknameBySessionId.remove(oldSessionId);
        }

        sessionsByPin.computeIfAbsent(gamePin, k -> ConcurrentHashMap.newKeySet()).add(wsSessionId);
        pinBySessionId.put(wsSessionId, gamePin);
        nicknameBySessionId.put(wsSessionId, nickname);
        pinReconnectMap.put(nickname, wsSessionId);
        connectionStatus.computeIfAbsent(gamePin, k -> new ConcurrentHashMap<>()).put(nickname, true);
    }

    public void markDisconnected(String wsSessionId) {
        Integer gamePin = pinBySessionId.get(wsSessionId);
        String nickname = nicknameBySessionId.get(wsSessionId);
        if (gamePin != null && nickname != null) {
            connectionStatus.getOrDefault(gamePin, new ConcurrentHashMap<>()).put(nickname, false);
            sessionsByPin.getOrDefault(gamePin, ConcurrentHashMap.newKeySet()).remove(wsSessionId);
            pinBySessionId.remove(wsSessionId);
            nicknameBySessionId.remove(wsSessionId);
        }
    }

    public void cleanupGame(Integer gamePin) {
        Set<String> sessions = sessionsByPin.remove(gamePin);
        if (sessions != null) {
            sessions.forEach(wsSessionId -> {
                pinBySessionId.remove(wsSessionId);
                nicknameBySessionId.remove(wsSessionId);
            });
        }
        reconnectMap.remove(gamePin);
        connectionStatus.remove(gamePin);
    }

    public Set<String> getSessionsByPin(Integer gamePin) {
        return sessionsByPin.getOrDefault(gamePin, Collections.emptySet());
    }

    public Map<String, Boolean> getConnectionStatus(Integer gamePin) {
        return connectionStatus.getOrDefault(gamePin, Collections.emptyMap());
    }

    public Integer getPinBySessionId(String wsSessionId) {
        return pinBySessionId.get(wsSessionId);
    }

    public String getNicknameBySessionId(String wsSessionId) {
        return nicknameBySessionId.get(wsSessionId);
    }
}