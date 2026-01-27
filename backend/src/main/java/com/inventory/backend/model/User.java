package com.inventory.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "users")
@Data
// Soft delete logic: runs an UPDATE instead of a DELETE
@SQLDelete(sql = "UPDATE users SET deleted = true WHERE id=?")
// MODERN REPLACEMENT for @Where: Filters out deleted users
@SQLRestriction("deleted = false") 
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String role; 

    // Soft delete flag
    private boolean deleted = false;
}