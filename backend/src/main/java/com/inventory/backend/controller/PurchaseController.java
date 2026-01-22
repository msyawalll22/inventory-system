package com.inventory.backend.controller;

import com.inventory.backend.model.Purchase;
import com.inventory.backend.model.Product; // Add this
import com.inventory.backend.repository.PurchaseRepository;
import com.inventory.backend.repository.ProductRepository; // Add this
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional; // Add this

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "*")
public class PurchaseController {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private ProductRepository productRepository; // Step 1: Link the Product Repository

    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    @PostMapping
    @Transactional // Step 2: Ensure both actions happen together or not at all
    public Purchase createPurchase(@RequestBody Purchase purchase, @RequestParam Long productId, @RequestParam Integer quantityBought) {
        
        // Step 3: Find the product we are restocking
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        // Step 4: Logic to increase the stock
        int updatedQuantity = product.getQuantity() + quantityBought;
        product.setQuantity(updatedQuantity);

        // Step 5: Save the updated product back to the database
        productRepository.save(product);

        // Step 6: Save the purchase record
        return purchaseRepository.save(purchase);
    }
}