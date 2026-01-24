package com.inventory.backend.model;



import jakarta.persistence.*;

import lombok.Getter;

import lombok.Setter;

import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;

import java.time.LocalDateTime;



@Entity

@Table(name = "purchases")

@Getter

@Setter

@NoArgsConstructor

@AllArgsConstructor

public class Purchase {

    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;



    // The Supplier who provided the goods

    @ManyToOne

    @JoinColumn(name = "supplier_id")

    private Supplier supplier;



    // The Product being purchased (Add this!)

    @ManyToOne

    @JoinColumn(name = "product_id")

    private Product product;



    // The Employee who recorded the purchase

    @ManyToOne

    @JoinColumn(name = "user_id")

    private User user;



    private Double unitPrice;  

    private Integer quantity;  

    private Double totalAmount;

    private String status; // e.g., "COMPLETED"



    @Column(name = "created_at", updatable = false)

    private LocalDateTime createdAt;



    @PrePersist

    protected void onCreate() {

        createdAt = LocalDateTime.now();

    }

}