package com.team35.quizapp.repository;

import com.team35.quizapp.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {

    // Used to check PIN uniqueness when creating a session,
    // and later to let players look up a session by the PIN they entered
    Optional<GameSession> findByGamePin(Integer gamePin);
}
