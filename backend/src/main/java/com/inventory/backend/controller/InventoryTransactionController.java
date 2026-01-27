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
        return transactionRepository.findAllSorted();
    }

    @PostMapping
    public ResponseEntity<InventoryTransaction> createTransaction(@RequestBody InventoryTransaction transaction) {
        InventoryTransaction saved = transactionRepository.save(transaction);
        // Refresh to trigger the formula lookup in sale_items
        return ResponseEntity.ok(transactionRepository.findById(saved.getId()).orElse(saved));
    }
}