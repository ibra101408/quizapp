package com.team35.quizapp.dto.quiz;

import java.time.LocalDateTime;
import java.util.List;

public record QuizResponse(
    Long id,
    String title,
    String theme,
    LocalDateTime createdAt,
    List<QuestionResponse> questions
) {}