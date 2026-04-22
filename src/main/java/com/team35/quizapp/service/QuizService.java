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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    private String getCurrentUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof String) return (String) principal;
        else if (principal instanceof UserDetails) return ((UserDetails) principal).getUsername();
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User session not found");
    }

    public QuizResponse createQuiz(CreateQuizRequest request) {
        String email = getCurrentUserEmail();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<Question> questions = buildQuestions(request.questions());

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

    @Transactional
    public QuizResponse updateQuiz(Long id, CreateQuizRequest request) {
        String email = getCurrentUserEmail();

        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (!quiz.getCreator().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot edit someone else's quiz");
        }

        // Update basic fields
        quiz.setTitle(request.title());
        quiz.setTheme(request.theme());

        // Replace all questions — orphanRemoval on Quiz.questions handles deletion
        quiz.getQuestions().clear();

        List<Question> newQuestions = buildQuestions(request.questions());
        newQuestions.forEach(q -> q.setQuiz(quiz));
        quiz.getQuestions().addAll(newQuestions);

        Quiz saved = quizRepository.save(quiz);
        return toResponse(saved);
    }

    public List<QuizResponse> getMyQuizzes() {
        String email = getCurrentUserEmail();
        return quizRepository.findByCreatorEmail(email).stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteQuiz(Long id) {
        String email = getCurrentUserEmail();
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
        if (!quiz.getCreator().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete someone else's quiz");
        }
        quizRepository.delete(quiz);
    }

    private List<Question> buildQuestions(List<CreateQuestionRequest> questionRequests) {
        return questionRequests.stream().map(qReq -> {
            Question question = Question.builder()
                    .text(qReq.text())
                    .timeLimit(qReq.timeLimit())
                    .imageUrl(qReq.imageUrl())
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
}
