package com.team35.quizapp;

import com.team35.quizapp.dto.user.CreateUserRequest;
import com.team35.quizapp.dto.user.UserResponse;
import com.team35.quizapp.entity.User;
import com.team35.quizapp.repository.UserRepository;
import com.team35.quizapp.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    // Test 1: successfully create a user
    @Test
    void createUser_success() {
        CreateUserRequest request = new CreateUserRequest(
                "testuser", "test@example.com", "password123");

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedpassword");
        when(userRepository.save(any(User.class))).thenReturn(
                User.builder()
                        .id(1L)
                        .username("testuser")
                        .email("test@example.com")
                        .passwordHash("hashedpassword")
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        UserResponse response = userService.createUser(request);

        assertNotNull(response);
        assertEquals("testuser", response.username());
        assertEquals("test@example.com", response.email());
        verify(userRepository, times(1)).save(any(User.class));
    }

    // Test 2: fail when username is already taken
    @Test
    void createUser_usernameAlreadyTaken() {
        CreateUserRequest request = new CreateUserRequest(
                "testuser", "test@example.com", "password123");

        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userService.createUser(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Username already taken", exception.getReason());
        verify(userRepository, never()).save(any());
    }

    // Test 3: fail when email is already registered
    @Test
    void createUser_emailAlreadyRegistered() {
        CreateUserRequest request = new CreateUserRequest(
                "testuser", "test@example.com", "password123");

        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userService.createUser(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Email already registered", exception.getReason());
    }

    // Test 4: fail when user not found
    @Test
    void getUserById_notFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> userService.getUserById(99L)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}