package com.inventory.backend.controller;

import com.inventory.backend.model.InventoryTransaction;
import com.inventory.backend.repository.InventoryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory-transactions") 
@CrossOrigin(origins = "*")
public class InventoryTransactionController {

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @GetMapping
    public List<InventoryTransaction> getAllTransactions() {
        // Fetches all records and triggers the @Formula to look up Purchases and Sales
        return transactionRepository.findAllSorted();
    }

    @PostMapping
    public ResponseEntity<InventoryTransaction> createTransaction(@RequestBody InventoryTransaction transaction) {
        // 1. Save the basic transaction (Product, Qty, Reference)
        InventoryTransaction savedTransaction = transactionRepository.save(transaction);
        
        // 2. IMPORTANT: Re-fetch from DB so the @Formula logic actually executes
        // This ensures totalAmount is fetched from the Sales/Purchases table immediately
        InventoryTransaction enrichedTransaction = transactionRepository.findById(savedTransaction.getId())
                .orElse(savedTransaction);
                
        return ResponseEntity.ok(enrichedTransaction);
    }
}