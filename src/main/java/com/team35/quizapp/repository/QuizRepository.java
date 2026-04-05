package com.team35.quizapp.repository;

import com.team35.quizapp.entity.Quiz;
import com.team35.quizapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCreator(User creator);
}