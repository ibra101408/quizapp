package com.team35.quizapp.repository;

import com.team35.quizapp.entity.Answer;
import com.team35.quizapp.entity.Question;
import com.team35.quizapp.entity.Quiz;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
class QuizRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    QuizRepository quizRepository;

    @Test
    void savesAndFindsQuiz() {
        Quiz quiz = Quiz.builder().title("Java Basics").description("Intro quiz").build();
        Quiz saved = quizRepository.save(quiz);

        Optional<Quiz> found = quizRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Java Basics");
    }

    @Test
    void deletesQuiz() {
        Quiz quiz = Quiz.builder().title("To Delete").build();
        Quiz saved = quizRepository.save(quiz);

        quizRepository.deleteById(saved.getId());

        assertThat(quizRepository.findById(saved.getId())).isEmpty();
    }

    @Test
    void savesQuizWithQuestionsAndAnswers() {
        Answer a1 = Answer.builder().text("4").correct(true).build();
        Answer a2 = Answer.builder().text("5").correct(false).build();

        Question q = Question.builder()
                .text("What is 2+2?")
                .orderIndex(1)
                .answers(List.of(a1, a2))
                .build();
        a1.setQuestion(q);
        a2.setQuestion(q);

        Quiz quiz = Quiz.builder().title("Math").build();
        q.setQuiz(quiz);
        quiz.getQuestions().add(q);

        Quiz saved = quizRepository.save(quiz);

        Quiz found = quizRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getQuestions()).hasSize(1);
        assertThat(found.getQuestions().get(0).getAnswers()).hasSize(2);
    }
}
