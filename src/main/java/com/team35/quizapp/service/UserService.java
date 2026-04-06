package com.team35.quizapp.service;

import com.team35.quizapp.dto.user.CreateUserRequest;
import com.team35.quizapp.dto.user.UpdateUserRequest;
import com.team35.quizapp.dto.user.UserResponse;
import com.team35.quizapp.entity.User;
import com.team35.quizapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse createUser(CreateUserRequest request) {
        log.debug("Creating user: username={}, email={}", request.username(), request.email());
        if (userRepository.existsByUsername(request.username())) {
            log.warn("Username already taken: {}", request.username());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            log.warn("Email already registered: {}", request.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        UserResponse response = UserResponse.from(userRepository.save(user));
        log.info("User created: id={}, username={}", response.id(), response.username());
        return response;
    }

    public UserResponse getUserById(Long id) {
        log.debug("Fetching user: id={}", id);
        return UserResponse.from(findOrThrow(id));
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        log.debug("Updating user: id={}", id);
        User user = findOrThrow(id);

        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                log.warn("Username already taken: {}", request.username());
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
            }
            user.setUsername(request.username());
        }

        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                log.warn("Email already registered: {}", request.email());
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
            }
            user.setEmail(request.email());
        }

        UserResponse response = UserResponse.from(userRepository.save(user));
        log.info("User updated: id={}", id);
        return response;
    }

    public void deleteUser(Long id) {
        log.debug("Deleting user: id={}", id);
        if (!userRepository.existsById(id)) {
            log.warn("User not found: id={}", id);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
        log.info("User deleted: id={}", id);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found: id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
                });
    }
}
