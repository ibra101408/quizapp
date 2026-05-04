package com.team35.quizapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerStateDto {

    private Long sessionId;
    private Long playerId;
    private boolean hasAnswered;
    private Map<Long, String> answers = new HashMap<>();
}