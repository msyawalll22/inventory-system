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

    /**
     * FINAL BULLETPROOF FORMULA (Option B):
     * 1. Works with "SLS-00055" style references.
     * 2. REPLACE(reference, 'SLS-', ''): Removes the text prefix.
     * 3. CAST(... AS UNSIGNED): Converts '00055' to the number 55 to match sale_items.sale_id.
     * 4. si.product_id = item_id: Ensures correct price for the specific item.
     */
    @Formula("(SELECT COALESCE(" +
             "(SELECT p.total_amount FROM purchases p WHERE p.reference = reference LIMIT 1), " +
             "(SELECT (ABS(quantity) * si.unit_price) FROM sale_items si " + 
             " WHERE si.sale_id = CAST(REPLACE(reference, 'SLS-', '') AS UNSIGNED) " + 
             " AND si.product_id = item_id LIMIT 1), " +
             "0))")
    private Double totalAmount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}