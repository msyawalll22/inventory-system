package com.inventory.backend.controller;

import com.inventory.backend.model.Purchase;
import com.inventory.backend.model.Product;
import com.inventory.backend.repository.PurchaseRepository;
import com.inventory.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "*")
public class PurchaseController {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private ProductService productService;

    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    // FIX 1: The "New Product" Door (Solves your 404)
    @PostMapping("/new-product")
    @Transactional
    public ResponseEntity<?> createPurchaseWithNewProduct(@RequestBody Purchase purchase) {
        try {
            // Save or reactivate the product first
            Product savedProduct = productService.saveOrUpdateProduct(purchase.getProduct());
            purchase.setProduct(savedProduct);
            
            return processPurchase(purchase);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // FIX 2: The "Existing Product" Door
    @PostMapping
    @Transactional
    public ResponseEntity<?> createPurchase(@RequestBody Purchase purchase) {
        try {
            return processPurchase(purchase);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Helper to keep logic clean and shared
    private ResponseEntity<Purchase> processPurchase(Purchase purchase) {
        // 1. Calculate Total
        if (purchase.getUnitPrice() != null && purchase.getQuantity() != null) {
            purchase.setTotalAmount(purchase.getUnitPrice() * purchase.getQuantity());
        }

        // 2. Update Stock & Log Transaction
        productService.updateStock(
            purchase.getProduct().getId(), 
            purchase.getQuantity(), 
            "PURCHASE: " + (purchase.getSupplier() != null ? purchase.getSupplier().getName() : "Restock")
        );

        // 3. Save Record
        return ResponseEntity.ok(purchaseRepository.save(purchase));
    }
}