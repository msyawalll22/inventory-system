package com.inventory.backend.controller;

import com.inventory.backend.model.InventoryTransaction;
import com.inventory.backend.repository.InventoryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class InventoryTransactionController {

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @GetMapping
    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping
    public InventoryTransaction createTransaction(@RequestBody InventoryTransaction transaction) {
        return transactionRepository.save(transaction);
    }
}