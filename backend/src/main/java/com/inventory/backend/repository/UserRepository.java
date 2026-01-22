package com.inventory.backend.repository;

import com.inventory.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This magic line tells Spring Boot to write the SQL: 
    // "SELECT * FROM users WHERE username = ?"
    User findByUsername(String username);
}