package com.team35.quizapp.controller;

import com.team35.quizapp.dto.AddQuestionRequest;
import com.team35.quizapp.dto.CreateQuizRequest;
import com.team35.quizapp.entity.Question;
import com.team35.quizapp.entity.Quiz;
import com.team35.quizapp.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Quiz createQuiz(@RequestBody CreateQuizRequest request) {
        return quizService.createQuiz(request);
    }

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizService.getAllQuizzes();
    }

    @GetMapping("/{id}")
    public Quiz getQuiz(@PathVariable Long id) {
        return quizService.getQuizById(id);
    }

    @PostMapping("/{id}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public Question addQuestion(@PathVariable Long id, @RequestBody AddQuestionRequest request) {
        return quizService.addQuestion(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
    }
}
