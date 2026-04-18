package com.team35.quizapp.service;

import com.team35.quizapp.dto.game.AnswerDto;
import com.team35.quizapp.dto.game.GameSessionResponse;
import com.team35.quizapp.dto.game.QuestionDto;
import com.team35.quizapp.dto.game.StartGameRequest;
import com.team35.quizapp.entity.*;
import com.team35.quizapp.entity.enums.GameStatus;
import com.team35.quizapp.repository.GameSessionRepository;
import com.team35.quizapp.repository.QuizRepository;
import com.team35.quizapp.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameSessionService {
    private final UserRepository userRepository;

    private final GameSessionRepository gameSessionRepository;
    private final QuizRepository quizRepository;

    // Called when the host clicks "Create Session" in the frontend.
    // Creates a session in WAITING state — players can join but the game has not started yet.
    // The host must call a separate "start game" endpoint after players have joined.
    @Transactional
    public GameSessionResponse createSession(StartGameRequest request, String email) {
        log.debug("Creating game session: hostId={}, quizId={}", email, request.quizId());

        User host = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                
        // Load the quiz — fail fast with 404 if it doesn't exist
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        // Security check: only the quiz creator can start a session with it.
        // hostId comes from the JWT token (set in JwtAuthFilter), not from the request body.
        if (!quiz.getCreator().getId().equals(host.getId())) {
            log.warn("Unauthorized session create: hostId={} does not own quizId={}", email, request.quizId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this quiz");
        }

        // A quiz with no questions cannot be played
        if (quiz.getQuestions().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quiz has no questions");
        }

        // Build the session entity. Status starts as WAITING — the game only becomes
        // IN_PROGRESS when the host explicitly starts it (future "start game" endpoint).
        GameSession session = GameSession.builder()
                .quiz(quiz)
                .host(quiz.getCreator()) // we already verified hostId == creator
                .gamePin(generateUniquePin())
                .status(GameStatus.WAITING)
                .currentQuestionIndex(0)
                .build();

        // Copy the quiz questions into session_question records with an explicit order_index.
        // This snapshot is important: if the quiz is edited later, the running session
        // is not affected — it plays the questions as they were when the session was created.
        List<Question> questions = quiz.getQuestions();
        for (int i = 0; i < questions.size(); i++) {
            SessionQuestion sq = SessionQuestion.builder()
                    .gameSession(session)
                    .question(questions.get(i))
                    .orderIndex(i) // 0-based position in the game
                    .build();
            session.getSessionQuestions().add(sq);
        }

        // Saving the session also persists the SessionQuestion records
        // because of the CascadeType.ALL on GameSession.sessionQuestions
        GameSession saved = gameSessionRepository.save(session);
        log.info("Game session created: id={}, pin={}, quizId={}", saved.getId(), saved.getGamePin(), quiz.getId());

        return toResponse(saved);
    }

    // Converts the saved GameSession entity into the response DTO.
    // Questions are sorted by orderIndex to guarantee correct order.
    private GameSessionResponse toResponse(GameSession session) {
        List<QuestionDto> questionDtos = session.getSessionQuestions().stream()
                .sorted(Comparator.comparingInt(SessionQuestion::getOrderIndex))
                .map(sq -> new QuestionDto(
                        sq.getQuestion().getId(),
                        sq.getQuestion().getText(),
                        sq.getQuestion().getTimeLimit(),
                        sq.getQuestion().getAnswers().stream()
                                // isCorrect is intentionally excluded from AnswerDto —
                                // see AnswerDto.java for explanation
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

    // Generates a random 6-digit PIN (100000–999999) that is not already in use.
    // Retries until a unique PIN is found — no error is surfaced to the caller.
    // Note: in production with millions of sessions this loop could become slow,
    // but for this project it is fine.
    private Integer generateUniquePin() {
        Random random = new Random();
        int pin;
        do {
            pin = 100000 + random.nextInt(900000);
        } while (gameSessionRepository.findByGamePin(pin).isPresent());
        return pin;
    }
}
