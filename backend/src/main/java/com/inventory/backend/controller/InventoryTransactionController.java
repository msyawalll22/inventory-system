package com.inventory.backend.controller;

import com.inventory.backend.model.InventoryTransaction;
import com.inventory.backend.repository.InventoryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
// Changed to match your history.html fetch URL
@RequestMapping("/api/inventory-transactions") 
@CrossOrigin(origins = "*")
public class InventoryTransactionController {

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @GetMapping
    public List<InventoryTransaction> getAllTransactions() {
        // Added sorting so the latest SALE or PURCHASE shows at the TOP of the table
        return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @PostMapping
    public InventoryTransaction createTransaction(@RequestBody InventoryTransaction transaction) {
        return transactionRepository.save(transaction);
    }
}