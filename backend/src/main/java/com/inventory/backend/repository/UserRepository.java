package com.inventory.backend.repository;

import com.inventory.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Finds a user by username
    User findByUsername(String username);

    // SQL equivalent: SELECT COUNT(*) FROM users WHERE role = ? AND deleted = ?
    long countByRoleAndDeleted(String role, boolean deleted);
}