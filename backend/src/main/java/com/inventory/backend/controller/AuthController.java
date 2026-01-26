package com.inventory.backend.controller;

import com.inventory.backend.config.JwtUtils;
import com.inventory.backend.model.User;
import com.inventory.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") 
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // --- 1. LOGIN (Public) ---
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user) {
        User existingUser = userRepository.findByUsername(user.getUsername());

        if (existingUser != null && passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
            String token = jwtUtils.generateToken(existingUser.getUsername(), existingUser.getRole());
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("id", existingUser.getId());
            response.put("username", existingUser.getUsername());
            response.put("role", existingUser.getRole());
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Invalid username or password.");
        }
    }

    // --- 2. REGISTER (Admin Only - Re-secured) ---
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestBody User user, 
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Security Check: Only an existing ADMIN can hit this endpoint
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access Denied: Only Admins can register new users.");
        }

        if (userRepository.findByUsername(user.getUsername()) != null) {
            return ResponseEntity.status(400).body("The username '" + user.getUsername() + "' is already taken.");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Back to normal: Default to STAFF if no role is specified
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("STAFF");
        }

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    // --- 3. GET ALL USERS (Admin Only) ---
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access Denied.");
        }
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword("PROTECTED")); 
        return ResponseEntity.ok(users);
    }

    // --- 4. DELETE USER (Admin Only) ---
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id, 
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access Denied.");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully.");
    }

    // --- HELPER METHOD: Check if the requester is an ADMIN ---
    private boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        try {
            String token = authHeader.substring(7);
            String role = jwtUtils.getRoleFromToken(token);
            return "ADMIN".equals(role);
        } catch (Exception e) {
            return false;
        }
    }
}