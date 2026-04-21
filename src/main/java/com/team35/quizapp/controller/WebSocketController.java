package com.team35.quizapp.controller;

import com.team35.quizapp.config.WebSocketSessionCache;
import com.team35.quizapp.dto.websocket.*;
import com.team35.quizapp.entity.GameSession;
import com.team35.quizapp.entity.Player;
import com.team35.quizapp.entity.SessionQuestion;
import com.team35.quizapp.repository.GameSessionRepository;
import com.team35.quizapp.repository.PlayerAnswerRepository;
import com.team35.quizapp.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final WebSocketSessionCache sessionCache;
    private final GameSessionRepository gameSessionRepository;
    private final PlayerRepository playerRepository;
    private final PlayerAnswerRepository playerAnswerRepository;

    @MessageMapping("/game.join")
    public void joinGame(@Payload JoinMessage message,
                         SimpMessageHeaderAccessor headerAccessor) {
        String wsSessionId = headerAccessor.getSessionId();
        Integer gamePin = message.gamePin();
        String nickname = message.nickname();

        playerRepository.findByGameSessionGamePinAndNickname(gamePin, nickname)
                .ifPresent(p -> {
                    if (Boolean.TRUE.equals(p.getIsKicked())) {
                        log.warn("Kicked player tried to rejoin: nickname={}, pin={}", nickname, gamePin);
                        messagingTemplate.convertAndSendToUser(
                                wsSessionId, "/queue/error",
                                "You have been kicked from this game."
                        );
                        return;
                    }
                });

        playerRepository.findByGameSessionGamePinAndNickname(gamePin, nickname)
                .orElseGet(() -> {
                    GameSession session = gameSessionRepository.findByGamePin(gamePin)
                            .orElseThrow(() -> new RuntimeException("Game session not found: " + gamePin));
                    Player player = Player.builder()
                            .gameSession(session)
                            .nickname(nickname)
                            .build();
                    return playerRepository.save(player);
                });

        sessionCache.addSession(gamePin, wsSessionId, nickname);
        log.info("Player joined: nickname={}, pin={}", nickname, gamePin);
        broadcastPlayerList(gamePin);
    }

    public void broadcastPlayerList(Integer gamePin) {
        List<Player> players = playerRepository.findByGameSessionGamePin(gamePin);
        Set<String> nicknames = players.stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsKicked()))
                .map(Player::getNickname)
                .collect(Collectors.toSet());
        messagingTemplate.convertAndSend("/topic/game/" + gamePin + "/players", new PlayerListMessage(nicknames));
    }

    public void broadcastKick(Integer gamePin, String nickname) {
        messagingTemplate.convertAndSend(
                "/topic/game/" + gamePin + "/kicked",
                new PlayerListMessage(java.util.Set.of(nickname))
        );
    }

    public void broadcastQuestion(GameSession session) {
        SessionQuestion currentSq = session.getSessionQuestions().stream()
                .sorted(Comparator.comparingInt(SessionQuestion::getOrderIndex))
                .filter(sq -> sq.getOrderIndex() == session.getCurrentQuestionIndex())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Question not found"));

        List<QuestionMessage.AnswerOption> answerOptions = currentSq.getQuestion().getAnswers().stream()
                .map(a -> new QuestionMessage.AnswerOption(a.getId(), a.getText()))
                .toList();

        QuestionMessage questionMessage = new QuestionMessage(
                currentSq.getQuestion().getId(),
                currentSq.getQuestion().getText(),
                currentSq.getQuestion().getTimeLimit(),
                session.getCurrentQuestionIndex(),
                session.getSessionQuestions().size(),
                answerOptions
        );

        messagingTemplate.convertAndSend("/topic/game/" + session.getGamePin() + "/question", questionMessage);
        log.info("Question broadcast: pin={}, questionIndex={}", session.getGamePin(), session.getCurrentQuestionIndex());
    }

    public void broadcastAnswerCount(Integer gamePin, Long questionId) {
        long answered = playerAnswerRepository.countByPlayerGameSessionGamePinAndQuestionId(gamePin, questionId);
        long total = playerRepository.findByGameSessionGamePin(gamePin).stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsKicked()))
                .count();
        messagingTemplate.convertAndSend(
                "/topic/game/" + gamePin + "/answer-count",
                new AnswerCountMessage((int) answered, (int) total)
        );
        log.info("Answer count broadcast: pin={}, answered={}/{}", gamePin, answered, total);
    }

    public void broadcastQuestionResult(Integer gamePin, QuestionResultMessage message) {
        messagingTemplate.convertAndSend("/topic/game/" + gamePin + "/question-result", message);
        log.info("Question result broadcast: pin={}, correctAnswerId={}", gamePin, message.correctAnswerId());
    }

    public void broadcastGameEnded(Integer gamePin) {
        messagingTemplate.convertAndSend("/topic/game/" + gamePin + "/ended", (Object) Map.of("ended", true));
        log.info("Game ended broadcast: pin={}", gamePin);
    }
}
