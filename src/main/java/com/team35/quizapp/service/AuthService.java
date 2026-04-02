package com.team35.quizapp.service;

import com.team35.quizapp.dto.user.AuthResponse; // Check your actual DTO package path
import com.team35.quizapp.dto.user.LoginRequest;
import com.team35.quizapp.entity.User;
import com.team35.quizapp.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.Value;
import com.team35.quizapp.config.JwtProvider;
import lombok.RequiredArgsConstructor;

import java.util.Collections;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider; // We will create this next

    public AuthResponse login(LoginRequest request) {
        try {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
            String token = jwtProvider.generateToken(authentication);
            return new AuthResponse(token);
        } catch (org.springframework.security.core.AuthenticationException e) {
            System.out.println("Login failed for: " + request.email() + " - Reason: " + e.getMessage());
            throw e;
        }
    }
    @Value("${GOOGLE_CLIENT_ID}")
    private String googleClientId;
    
    private final UserRepository userRepository;
    public AuthResponse loginWithGoogle(String idTokenString) {
        try {
            // 1. Setup the Verifier
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            // 2. Verify the token
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google Token");
            }

            // 3. Extract user info from Google's payload
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // 4. Find or Create the user in our DB
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .email(email)
                                .username(email) // Default username to email
                                .passwordHash(null) // Google users don't have a local password
                                .build();
                        return userRepository.save(newUser);
                    });

            // 5. Generate YOUR app's JWT (Same logic as normal login)
            String appToken = jwtProvider.generateToken(user); 
            return new AuthResponse(appToken);

        } catch (Exception e) {
            throw new RuntimeException("Google Authentication failed", e);
        }
    }
    
}