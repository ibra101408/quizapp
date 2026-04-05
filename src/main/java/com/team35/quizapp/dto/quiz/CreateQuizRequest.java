package com.team35.quizapp.dto.quiz;

import java.util.List;

public record CreateQuizRequest(
    String title,
    String theme,
    List<CreateQuestionRequest> questions
) {}