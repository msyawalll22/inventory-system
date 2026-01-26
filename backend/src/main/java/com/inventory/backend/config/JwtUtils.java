package com.inventory.backend.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    // This is the secret key. In a real app, move this to application.properties
    private final String jwtSecret = "mySecretKeyForInventoryProSystem2026!@#";
    private final int jwtExpirationMs = 86400000; // 24 hours (in milliseconds)

    private final Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

    // 1. Generate a token when user logs in
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role) // Store the role inside the JWT!
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Validate the token sent by React
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            System.out.println("Invalid JWT: " + e.getMessage());
        }
        return false;
    }

    // 3. Extract Username from token
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    // 4. Extract Role from token (Crucial for @PreAuthorize)
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
        return claims.get("role", String.class);
    }
}