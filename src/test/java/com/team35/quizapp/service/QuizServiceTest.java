package com.team35.quizapp.service;

import com.team35.quizapp.dto.AddQuestionRequest;
import com.team35.quizapp.dto.AnswerOption;
import com.team35.quizapp.dto.CreateQuizRequest;
import com.team35.quizapp.entity.Quiz;
import com.team35.quizapp.repository.QuizRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @Mock
    QuizRepository quizRepository;

    @InjectMocks
    QuizService quizService;

    @Test
    void createQuiz_savesAndReturns() {
        CreateQuizRequest request = new CreateQuizRequest("Quiz 1", "Description");
        Quiz quiz = Quiz.builder().title("Quiz 1").description("Description").build();
        when(quizRepository.save(any())).thenReturn(quiz);

        Quiz result = quizService.createQuiz(request);

        assertThat(result.getTitle()).isEqualTo("Quiz 1");
        verify(quizRepository).save(any());
    }

    @Test
    void getQuizById_notFound_throwsNotFound() {
        when(quizRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> quizService.getQuizById(99L));
    }

    @Test
    void deleteQuiz_notFound_throwsNotFound() {
        when(quizRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResponseStatusException.class, () -> quizService.deleteQuiz(99L));
    }

    @Test
    void deleteQuiz_exists_callsRepository() {
        when(quizRepository.existsById(1L)).thenReturn(true);

        quizService.deleteQuiz(1L);

        verify(quizRepository).deleteById(1L);
    }

    @Test
    void addQuestion_quizNotFound_throwsNotFound() {
        when(quizRepository.findById(99L)).thenReturn(Optional.empty());
        AddQuestionRequest request = new AddQuestionRequest("Q?", 1, List.of(new AnswerOption("A", true)));

        assertThrows(ResponseStatusException.class, () -> quizService.addQuestion(99L, request));
    }
}
