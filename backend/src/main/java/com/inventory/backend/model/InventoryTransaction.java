package com.inventory.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Formula;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Data
public class InventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String description; 
    private Integer quantity;    
    private String reference;   

    // FIXED: Use alias "reference" specifically to refer to this entity's column
    @Formula("(SELECT COALESCE(" +
             "(SELECT p.total_amount FROM purchases p WHERE p.reference = reference LIMIT 1), " +
             "(SELECT s.total_amount FROM sales s WHERE s.reference = reference LIMIT 1), " +
             "0))")
    private Double totalAmount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}