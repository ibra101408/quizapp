package com.team35.quizapp.service;

import com.team35.quizapp.config.WebSocketSessionCache;
import com.team35.quizapp.controller.WebSocketController;
import com.team35.quizapp.dto.game.SubmitAnswerRequest;
import com.team35.quizapp.entity.Answer;
import com.team35.quizapp.entity.GameSession;
import com.team35.quizapp.entity.Player;
import com.team35.quizapp.entity.PlayerAnswer;
import com.team35.quizapp.entity.Question;
import com.team35.quizapp.repository.AnswerRepository;
import com.team35.quizapp.repository.GameSessionRepository;
import com.team35.quizapp.repository.PlayerAnswerRepository;
import com.team35.quizapp.repository.PlayerRepository;
import com.team35.quizapp.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final PlayerAnswerRepository playerAnswerRepository;
    private final GameSessionRepository gameSessionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final WebSocketSessionCache sessionCache;
    private final WebSocketController webSocketController;

    public void kickPlayer(Integer gamePin, String nickname) {
        Player player = playerRepository.findByGameSessionGamePinAndNickname(gamePin, nickname)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));

        player.setIsKicked(true);
        playerRepository.save(player);
        log.info("Player kicked: nickname={}, pin={}", nickname, gamePin);

        String wsSessionId = sessionCache.getSessionIdByNickname(gamePin, nickname);
        if (wsSessionId != null) {
            sessionCache.markDisconnected(wsSessionId);
        }

        webSocketController.broadcastKick(gamePin, nickname);
        webSocketController.broadcastPlayerList(gamePin);
    }

    @Transactional
    public void submitAnswer(Integer gamePin, SubmitAnswerRequest request) {
        // 1. Find session (needed for question_started_at and timeLimit)
        GameSession session = gameSessionRepository.findByGamePin(gamePin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        // 2. Find player
        Player player = playerRepository.findByGameSessionGamePinAndNickname(gamePin, request.nickname())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));

        // 3. Prevent double submission
        if (playerAnswerRepository.existsByPlayerIdAndQuestionId(player.getId(), request.questionId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already answered this question");
        }

        // 4. Look up question and answer entities
        Question question = questionRepository.findById(request.questionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        Answer answer = answerRepository.findById(request.answerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Answer not found"));

        // 5. Calculate response time in seconds from when question was broadcast
        int responseTime = (int) Duration.between(session.getQuestionStartedAt(), LocalDateTime.now()).getSeconds();

        // 6. Calculate score — 0 if wrong answer, time-based if correct
        int score = answer.getIsCorrect()
                ? calculateScore(responseTime, question.getTimeLimit())
                : 0;

        // 7. Save player_answer
        PlayerAnswer playerAnswer = PlayerAnswer.builder()
                .player(player)
                .question(question)
                .answer(answer)
                .responseTime(responseTime)
                .scoreAwarded(score)
                .build();
        playerAnswerRepository.save(playerAnswer);

        // 8. Add score to player's total
        player.setScore(player.getScore() + score);
        playerRepository.save(player);

        log.info("Answer saved: pin={}, nickname={}, correct={}, score={}, responseTime={}s",
                gamePin, request.nickname(), answer.getIsCorrect(), score, responseTime);
    }

    /**
     * Scoring formula (max 1000 points):
     *   0%  – 7%  of time used → 1000 down to 800  (fast bonus zone)
     *   7%  – 50% of time used → 800  down to 500  (normal zone)
     *   50% – 100% of time used → 500 down to 0   (slow zone)
     */
    private int calculateScore(int responseTime, int timeLimit) {
        if (timeLimit <= 0) return 0;
        double pct = (double) responseTime / timeLimit * 100.0;

        if (pct <= 7.0) {
            return (int) Math.round(1000 - (200.0 * pct / 7.0));
        } else if (pct <= 50.0) {
            return (int) Math.round(800 - (300.0 * (pct - 7.0) / 43.0));
        } else {
            return (int) Math.round(500 - (500.0 * (pct - 50.0) / 50.0));
        }
    }
}
