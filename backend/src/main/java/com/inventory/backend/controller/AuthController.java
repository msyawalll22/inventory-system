package com.inventory.backend.controller;

import com.inventory.backend.model.User;
import com.inventory.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") 
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public String registerUser(@RequestBody User user) {
        try {
            userRepository.save(user);
            return "User registered successfully!";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    // NEW: Login endpoint
    @PostMapping("/login")
    public String loginUser(@RequestBody User user) {
        // 1. Check if user exists in database
        User existingUser = userRepository.findByUsername(user.getUsername());

        // 2. Validate password
        if (existingUser != null && existingUser.getPassword().equals(user.getPassword())) {
            return "Login successful! Welcome " + existingUser.getUsername();
        } else {
            return "Invalid username or password";
        }
    }
}