package com.team35.quizapp.service;

import com.team35.quizapp.dto.AddQuestionRequest;
import com.team35.quizapp.dto.CreateQuizRequest;
import com.team35.quizapp.entity.Answer;
import com.team35.quizapp.entity.Question;
import com.team35.quizapp.entity.Quiz;
import com.team35.quizapp.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;

    public Quiz createQuiz(CreateQuizRequest request) {
        Quiz quiz = Quiz.builder()
                .title(request.title())
                .description(request.description())
                .build();
        return quizRepository.save(quiz);
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public Quiz getQuizById(Long id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    @Transactional
    public Question addQuestion(Long quizId, AddQuestionRequest request) {
        Quiz quiz = getQuizById(quizId);

        Question question = Question.builder()
                .quiz(quiz)
                .text(request.text())
                .orderIndex(request.orderIndex())
                .build();

        List<Answer> answers = request.answers().stream()
                .map(opt -> Answer.builder()
                        .question(question)
                        .text(opt.text())
                        .correct(opt.correct())
                        .build())
                .toList();

        question.setAnswers(answers);
        quiz.getQuestions().add(question);
        quizRepository.save(quiz);
        return question;
    }

    public void deleteQuiz(Long id) {
        if (!quizRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
        quizRepository.deleteById(id);
    }
}
