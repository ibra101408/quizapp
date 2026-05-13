package com.team35.quizapp.service;

import com.team35.quizapp.config.WebSocketSessionCache;
import com.team35.quizapp.controller.WebSocketController;
import com.team35.quizapp.dto.game.AnswerSubmitResponse;
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
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
    public AnswerSubmitResponse submitAnswer(Integer gamePin, SubmitAnswerRequest request) {
        // 1. Find session
        GameSession session = gameSessionRepository.findByGamePin(gamePin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        // 2. Find player
        Player player = playerRepository.findByGameSessionGamePinAndNickname(gamePin, request.nickname())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));

        // 3. Prevent double submission
        if (playerAnswerRepository.existsByPlayerIdAndQuestionId(player.getId(), request.questionId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already answered this question");
        }

        // 4. Load question
        Question question = questionRepository.findById(request.questionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));

        // 5. Load submitted answers
        List<Answer> submittedAnswers = answerRepository.findAllById(request.answerIds());
        if (submittedAnswers.size() != request.answerIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more answer IDs not found");
        }

        // 6. Calculate response time
        int responseTime = (int) Duration.between(session.getQuestionStartedAt(), LocalDateTime.now()).getSeconds();

        // 7. Check correctness:
        //    Player must select ALL correct answers and NO wrong ones to score
        Set<Long> correctAnswerIds = question.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .map(Answer::getId)
                .collect(Collectors.toSet());

        Set<Long> submittedIds = request.answerIds().stream().collect(Collectors.toSet());
        boolean fullyCorrect = submittedIds.equals(correctAnswerIds);

        int score = fullyCorrect ? calculateScore(responseTime, question.getTimeLimit()) : 0;

        // 8. Save one PlayerAnswer row per submitted answer
        for (Answer answer : submittedAnswers) {
            PlayerAnswer playerAnswer = PlayerAnswer.builder()
                    .player(player)
                    .question(question)
                    .answer(answer)
                    .responseTime(responseTime)
                    .scoreAwarded(score) // same score recorded on each row; total counted once below
                    .build();
            playerAnswerRepository.save(playerAnswer);
        }

        // 9. Update player total score (once, not per answer)
        player.setScore(player.getScore() + score);
        playerRepository.save(player);

        // 10. Broadcast updated answer count
        webSocketController.broadcastAnswerCount(gamePin, request.questionId());

        log.info("Answer saved: pin={}, nickname={}, fullyCorrect={}, score={}, responseTime={}s",
                gamePin, request.nickname(), fullyCorrect, score, responseTime);

        return new AnswerSubmitResponse(fullyCorrect, score, player.getScore());
    }

    /**
     * Scoring formula (max 1000 points):
     *   0%  – 7%  of time used → 1000 down to 800
     *   7%  – 50% of time used → 800  down to 500
     *   50% – 100% of time used → 500 down to 0
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
