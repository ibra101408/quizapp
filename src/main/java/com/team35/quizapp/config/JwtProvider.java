package com.team35.quizapp.config;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.team35.quizapp.entity.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {
    
    @Value("${app.jwt.secret:defaultSecretKeyThatIsAtLeast32CharactersLong!!}")
    private String jwtSecret;

    private final long JWT_EXPIRATION = 86400000; // 24 hours

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail()) // 🔁 было setSubject
                .issuedAt(new Date())     // 🔁 было setIssuedAt
                .expiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION)) // 🔁 было setExpiration
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String generateToken(Authentication authentication) {
        String email = authentication.getName();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
    }
}