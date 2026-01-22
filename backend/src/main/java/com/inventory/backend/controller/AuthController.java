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
            // If the JSON includes "role": {"id": 1}, JPA will automatically link it
            userRepository.save(user);
            return "User registered successfully!";
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    @PostMapping("/login")
    public String loginUser(@RequestBody User user) {
        User existingUser = userRepository.findByUsername(user.getUsername());

        if (existingUser != null && existingUser.getPassword().equals(user.getPassword())) {
            // We can now even return what their role is in the welcome message
            String roleName = (existingUser.getRole() != null) ? existingUser.getRole().getName() : "No Role";
            return "Login successful! Welcome " + existingUser.getUsername() + " (Role: " + roleName + ")";
        } else {
            return "Invalid username or password";
        }
    }
}