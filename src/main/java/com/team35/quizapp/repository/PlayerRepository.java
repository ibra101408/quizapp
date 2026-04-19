package com.team35.quizapp.repository;

import com.team35.quizapp.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    Optional<Player> findByGameSessionGamePinAndNickname(Integer gamePin, String nickname);
    List<Player> findByGameSessionGamePin(Integer gamePin);
}