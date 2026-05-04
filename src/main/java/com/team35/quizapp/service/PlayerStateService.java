package com.team35.quizapp.service;

import tools.jackson.databind.ObjectMapper;
import com.team35.quizapp.dto.PlayerStateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class PlayerStateService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private String key(Long sessionId, Long playerId) {
        return "session:" + sessionId + ":player:" + playerId;
    }

    public void saveState(PlayerStateDto state) {
        try {
            String json = objectMapper.writeValueAsString(state);

            redisTemplate.opsForValue().set(
                    key(state.getSessionId(), state.getPlayerId()),
                    json,
                    Duration.ofHours(1)
            );

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public PlayerStateDto getState(Long sessionId, Long playerId) {
     
        try {
            String json = redisTemplate.opsForValue().get(
                    key(sessionId, playerId)
            );

            if (json == null) {
                return null;
            }

            return objectMapper.readValue(json, PlayerStateDto.class);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }



}