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
    
    // 1. Ensure description can hold a bit more text
    @Column(columnDefinition = "TEXT")
    private String description;

    private Double price;
    
    // 2. Add the Promotion Price field
    private Double promoPrice;

    private Integer quantity;

    // 3. ADD THIS: Use @Lob and @Column to store the JPG Base64 string
    @Lob 
    @Column(columnDefinition = "LONGTEXT") 
    private String imageUrl;

    /**
     * SOFT DELETE FLAG
     * This allows us to "delete" a product from the UI 
     * without breaking the Foreign Key links in inventory_transactions.
     */
    @Column(nullable = false)
    private boolean active = true; 
}