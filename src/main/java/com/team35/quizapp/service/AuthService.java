package com.team35.quizapp.service;

import com.team35.quizapp.dto.user.AuthResponse;
import com.team35.quizapp.dto.user.LoginRequest;
import com.team35.quizapp.entity.User;
import com.team35.quizapp.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import com.team35.quizapp.config.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;


@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public AuthResponse register(com.team35.quizapp.dto.user.CreateUserRequest request) {
        log.debug("Register attempt: email={}", request.email());
        if (userRepository.findByEmail(request.email()).isPresent()) {
            log.warn("Register failed — email already in use: {}", request.email());
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        userRepository.save(user);
        log.info("User registered: id={}, email={}", user.getId(), user.getEmail());

        String token = jwtProvider.generateToken(user);
        return new AuthResponse(token);
    }
    

    public AuthResponse login(LoginRequest request) {
        log.debug("Login attempt: email={}", request.email());
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            String token = jwtProvider.generateToken(authentication);
            log.info("Login success: email={}", request.email());
            return new AuthResponse(token);
        } catch (org.springframework.security.core.AuthenticationException e) {
            log.warn("Login failed: email={} — {}", request.email(), e.getMessage());
            throw e;
        }
    }

    @Value("${GOOGLE_CLIENT_ID:${spring.security.oauth2.client.registration.google.client-id}}")    
    private String googleClientId;

    @jakarta.annotation.PostConstruct
    public void init() {
        System.out.println("DEBUG: Google Client ID loaded as: " + googleClientId);
    }

    private final UserRepository userRepository;
    public AuthResponse loginWithGoogle(String idTokenString) {
        log.debug("Google login attempt");
        try {
            
            GoogleIdToken idToken = GoogleIdToken.parse(new GsonFactory(), idTokenString);
         
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
            
            GoogleIdToken verifiedToken = verifier.verify(idTokenString);

            if (verifiedToken == null) {
                throw new RuntimeException("Invalid Google Token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();

            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .email(email)
                                .username(email)
                                .passwordHash(null)
                                .build();
                        return userRepository.save(newUser);
                    });

            String appToken = jwtProvider.generateToken(user);
            log.info("Google login success: email={}", email);
            return new AuthResponse(appToken);

        } catch (Exception e) {
            log.warn("Google login failed: {}", e.getMessage());
            throw new RuntimeException("Google Authentication failed", e);
        }
    }
    
}