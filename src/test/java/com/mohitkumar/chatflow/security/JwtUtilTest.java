package com.mohitkumar.chatflow.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "this-is-a-very-long-secret-key-for-testing-purposes-only");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L); 
    }

    @Test
    void generateToken_And_ExtractUsername() {
        String token = jwtUtil.generateToken("testuser");
        assertNotNull(token);
        
        String extractedUsername = jwtUtil.extractUsername(token);
        assertEquals("testuser", extractedUsername);
    }

    @Test
    void isTokenValid_ReturnsTrue_ForCorrectUser() {
        String token = jwtUtil.generateToken("mohit");
        UserDetails userDetails = new User("mohit", "password", new ArrayList<>());

        assertTrue(jwtUtil.isTokenValid(token, userDetails));
    }

    @Test
    void isTokenValid_ReturnsFalse_ForWrongUser() {
        String token = jwtUtil.generateToken("mohit");
        UserDetails wrongUser = new User("hacker", "password", new ArrayList<>());

        assertFalse(jwtUtil.isTokenValid(token, wrongUser));
    }
}