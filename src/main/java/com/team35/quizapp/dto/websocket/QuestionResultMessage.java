package com.team35.quizapp.dto.websocket;

import java.util.List;

public record QuestionResultMessage(
        List<Long> correctAnswerIds,
        List<LeaderboardEntry> leaderboard
) {
    public record LeaderboardEntry(int position, String nickname, int score) {}
}
