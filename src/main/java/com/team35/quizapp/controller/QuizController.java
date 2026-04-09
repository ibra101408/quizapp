package com.team35.quizapp.controller;

import com.team35.quizapp.dto.quiz.CreateQuizRequest;
import com.team35.quizapp.dto.quiz.QuizResponse;
import com.team35.quizapp.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Quiz", description = "Quiz management")
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @Operation(summary = "Create a new quiz")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuizResponse createQuiz(@RequestBody CreateQuizRequest request) {
        return quizService.createQuiz(request);
    }

    @Operation(summary = "Get my quizzes")
    @GetMapping("/my-quizzes")
    public List<QuizResponse> getMyQuizzes() {
        return quizService.getMyQuizzes();
    }

    @Operation(summary = "Delete a quiz")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
    }
}