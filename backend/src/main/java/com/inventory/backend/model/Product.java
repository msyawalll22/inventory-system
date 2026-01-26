package com.inventory.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // ADDED: Matches your SQL ALTER TABLE command
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double price;

    private Integer quantity;

    @Lob 
    @Column(columnDefinition = "LONGTEXT") 
    private String imageUrl;

    @Column(nullable = false)
    private boolean active = true; 
}