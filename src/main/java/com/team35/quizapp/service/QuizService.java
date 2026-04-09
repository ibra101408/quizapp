package com.team35.quizapp.service;

import com.team35.quizapp.dto.quiz.*;
import com.team35.quizapp.entity.Answer;
import com.team35.quizapp.entity.Question;
import com.team35.quizapp.entity.Quiz;
import com.team35.quizapp.entity.User;
import com.team35.quizapp.repository.QuizRepository;
import com.team35.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    public QuizResponse createQuiz(CreateQuizRequest request) {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        List<Question> questions = request.questions().stream().map(qReq -> {
            Question question = Question.builder()
                    .text(qReq.text())
                    .timeLimit(qReq.timeLimit())
                    .questionType("MULTIPLE_CHOICE")
                    .build();

            List<Answer> answers = qReq.answers().stream().map(aReq ->
                    Answer.builder()
                            .text(aReq.text())
                            .isCorrect(aReq.isCorrect())
                            .question(question)
                            .build()
            ).toList();

            question.setAnswers(answers);
            return question;
        }).toList();

        Quiz quiz = Quiz.builder()
                .title(request.title())
                .theme(request.theme())
                .creator(currentUser)
                .questions(questions)
                .build();

        questions.forEach(q -> q.setQuiz(quiz));

        Quiz saved = quizRepository.save(quiz);
        return toResponse(saved);
    }

    private QuizResponse toResponse(Quiz quiz) {
        List<QuestionResponse> questionResponses = quiz.getQuestions().stream().map(q -> {
            List<AnswerResponse> answerResponses = q.getAnswers().stream().map(a ->
                    new AnswerResponse(a.getId(), a.getText(), a.getIsCorrect())
            ).toList();
            return new QuestionResponse(q.getId(), q.getText(), q.getTimeLimit(), answerResponses);
        }).toList();

        return new QuizResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getTheme(),
                quiz.getCreatedAt(),
                questionResponses
        );
    }

    public List<QuizResponse> getMyQuizzes() {
        String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return quizRepository.findByCreatorEmail(currentUser.getEmail()).stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
        quizRepository.delete(quiz);
    }
}
