package com.team35.quizapp.repository;

import com.team35.quizapp.entity.PlayerAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerAnswerRepository extends JpaRepository<PlayerAnswer, Long> {
    boolean existsByPlayerIdAndQuestionId(Long playerId, Long questionId);
    long countByPlayerGameSessionGamePinAndQuestionId(Integer gamePin, Long questionId);
}
