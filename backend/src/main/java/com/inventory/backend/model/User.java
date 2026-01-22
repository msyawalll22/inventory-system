package com.inventory.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    // CHANGED: Instead of a String, we use the Role entity
    // This creates the role_id (FK) column from your diagram
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role; 
}