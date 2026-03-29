package com.team35.quizapp;

import tools.jackson.databind.ObjectMapper;
import com.team35.quizapp.controller.UserController;
import com.team35.quizapp.dto.user.CreateUserRequest;
import com.team35.quizapp.dto.user.UserResponse;
import com.team35.quizapp.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.security.oauth2.client.autoconfigure.servlet.OAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;


import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = UserController.class, excludeAutoConfiguration = {
    OAuth2ClientWebSecurityAutoConfiguration.class
})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    // Test 1: successfully create a user
    @Test
    @WithMockUser
    void createUser_success() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "testuser", "test@example.com", "password123");

        UserResponse response = new UserResponse(
                1L, "testuser", "test@example.com", LocalDateTime.now());

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    // Test 2: conflict when username already taken
    @Test
    @WithMockUser
    void createUser_conflict() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "testuser", "test@example.com", "password123");

        when(userService.createUser(any(CreateUserRequest.class)))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.CONFLICT, "Username already taken"));

        mockMvc.perform(post("/api/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    // Test 3: get user by id
    @Test
    @WithMockUser
    void getUserById_success() throws Exception {
        UserResponse response = new UserResponse(
                1L, "testuser", "test@example.com", LocalDateTime.now());

        when(userService.getUserById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    // Test 4: user not found
    @Test
    @WithMockUser
    void getUserById_notFound() throws Exception {
        when(userService.getUserById(99L))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        mockMvc.perform(get("/api/users/99"))
                .andExpect(status().isNotFound());
    }
}