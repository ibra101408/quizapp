package com.team35.quizapp.service;

import com.team35.quizapp.dto.game.AnswerDto;
import com.team35.quizapp.dto.game.GameSessionResponse;
import com.team35.quizapp.dto.game.QuestionDto;
import com.team35.quizapp.dto.game.StartGameRequest;
import com.team35.quizapp.dto.websocket.QuestionResultMessage;
import com.team35.quizapp.entity.*;
import com.team35.quizapp.entity.enums.GameStatus;
import com.team35.quizapp.repository.GameSessionRepository;
import com.team35.quizapp.repository.PlayerRepository;
import com.team35.quizapp.repository.QuizRepository;
import com.team35.quizapp.repository.UserRepository;
import com.team35.quizapp.controller.WebSocketController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameSessionService {
    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;
    private final QuizRepository quizRepository;
    private final PlayerRepository playerRepository;
    private final WebSocketController webSocketController;

    @Transactional
    public GameSessionResponse createSession(StartGameRequest request, String email) {
        log.debug("Creating game session: hostId={}, quizId={}", email, request.quizId());

        User host = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (!quiz.getCreator().getId().equals(host.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this quiz");
        }

        if (quiz.getQuestions().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz has no questions");
        }

        GameSession session = GameSession.builder()
                .quiz(quiz)
                .host(quiz.getCreator())
                .gamePin(generateUniquePin())
                .status(GameStatus.WAITING)
                .currentQuestionIndex(0)
                .build();

        List<Question> questions = quiz.getQuestions();
        for (int i = 0; i < questions.size(); i++) {
            SessionQuestion sq = SessionQuestion.builder()
                    .gameSession(session)
                    .question(questions.get(i))
                    .orderIndex(i)
                    .build();
            session.getSessionQuestions().add(sq);
        }

        GameSession saved = gameSessionRepository.save(session);
        log.info("Game session created: id={}, pin={}, quizId={}", saved.getId(), saved.getGamePin(), quiz.getId());
        return toResponse(saved);
    }

    @Transactional
    public void startGame(Integer gamePin, String email) {
        GameSession session = gameSessionRepository.findByGamePin(gamePin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game session not found"));

        if (!session.getHost().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can start the game");
        }

        if (session.getStatus() != GameStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Game is not in WAITING state");
        }

        session.setStatus(GameStatus.IN_PROGRESS);
        session.setCurrentQuestionIndex(0);
        session.setQuestionStartedAt(LocalDateTime.now());
        gameSessionRepository.save(session);
        log.info("Game started: pin={}", gamePin);

        webSocketController.broadcastQuestion(session);
    }

    @Transactional
    public void endQuestion(Integer gamePin, String email) {
        GameSession session = gameSessionRepository.findByGamePin(gamePin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game session not found"));

        if (!session.getHost().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can end the question");
        }

        // Find current session question
        SessionQuestion currentSq = session.getSessionQuestions().stream()
                .filter(sq -> sq.getOrderIndex() == session.getCurrentQuestionIndex())
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Question not found"));

        // Find the correct answer ID
        Long correctAnswerId = currentSq.getQuestion().getAnswers().stream()
                .filter(Answer::getIsCorrect)
                .map(Answer::getId)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No correct answer found"));

        // Build top 5 leaderboard
        List<Player> sorted = playerRepository.findByGameSessionGamePin(gamePin).stream()
                .filter(p -> !Boolean.TRUE.equals(p.getIsKicked()))
                .sorted(Comparator.comparingInt(Player::getScore).reversed())
                .limit(5)
                .toList();

        List<QuestionResultMessage.LeaderboardEntry> leaderboard = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            leaderboard.add(new QuestionResultMessage.LeaderboardEntry(
                    i + 1, sorted.get(i).getNickname(), sorted.get(i).getScore()
            ));
        }

        webSocketController.broadcastQuestionResult(gamePin, new QuestionResultMessage(correctAnswerId, leaderboard));
        log.info("Question ended: pin={}, questionIndex={}", gamePin, session.getCurrentQuestionIndex());
    }

    @Transactional
    public void nextQuestion(Integer gamePin, String email) {
        GameSession session = gameSessionRepository.findByGamePin(gamePin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game session not found"));

        if (!session.getHost().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can advance the question");
        }

        int nextIndex = session.getCurrentQuestionIndex() + 1;

        if (nextIndex >= session.getSessionQuestions().size()) {
            session.setStatus(GameStatus.FINISHED);
            gameSessionRepository.save(session);
            log.info("Game finished: pin={}", gamePin);
            // End game broadcast will be handled in a future ticket
            return;
        }

        session.setCurrentQuestionIndex(nextIndex);
        session.setQuestionStartedAt(LocalDateTime.now());
        gameSessionRepository.save(session);
        log.info("Next question: pin={}, questionIndex={}", gamePin, nextIndex);

        webSocketController.broadcastQuestion(session);
    }

    @Transactional
    public void endGame(Integer gamePin, String email) {
        GameSession session = gameSessionRepository.findByGamePin(gamePin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Game session not found"));

        if (!session.getHost().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host can end the game");
        }

        session.setStatus(GameStatus.FINISHED);
        gameSessionRepository.save(session);
        log.info("Game force-ended by host: pin={}", gamePin);

        webSocketController.broadcastGameEnded(gamePin);
    }

    private GameSessionResponse toResponse(GameSession session) {
        List<QuestionDto> questionDtos = session.getSessionQuestions().stream()
                .sorted(Comparator.comparingInt(SessionQuestion::getOrderIndex))
                .map(sq -> new QuestionDto(
                        sq.getQuestion().getId(),
                        sq.getQuestion().getText(),
                        sq.getQuestion().getImageUrl(),
                        sq.getQuestion().getTimeLimit(),
                        sq.getQuestion().getAnswers().stream()
                                .map(a -> new AnswerDto(a.getId(), a.getText()))
                                .toList()
                ))
                .toList();

        return new GameSessionResponse(
                session.getId(),
                session.getGamePin(),
                session.getQuiz().getId(),
                session.getQuiz().getTitle(),
                session.getStatus().name(),
                session.getCurrentQuestionIndex(),
                questionDtos
        );
    }

    private Integer generateUniquePin() {
        Random random = new Random();
        int pin;
        do {
            pin = 100000 + random.nextInt(900000);
        } while (gameSessionRepository.findByGamePin(pin).isPresent());
        return pin;
    }
}
