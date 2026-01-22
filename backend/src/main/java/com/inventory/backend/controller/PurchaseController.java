package com.inventory.backend.controller;

import com.inventory.backend.model.Purchase;
import com.inventory.backend.model.Product;
import com.inventory.backend.repository.PurchaseRepository;
import com.inventory.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    private ProductRepository productRepository;

    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    @PostMapping
    @Transactional
    public Purchase createPurchase(@RequestBody Purchase purchase, @RequestParam Long productId) {
        
        // 1. Find the product we are restocking
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        // 2. Automated Financial Math
        // We multiply the unitPrice by the quantity provided in the JSON
        Double total = purchase.getUnitPrice() * purchase.getQuantity();
        purchase.setTotalAmount(total);

        // 3. Update the stock quantity in the Product table
        int updatedQuantity = product.getQuantity() + purchase.getQuantity();
        product.setQuantity(updatedQuantity);

        // 4. Save the updated product
        productRepository.save(product);

        // 5. Save the detailed purchase record (with unitPrice and quantity)
        return purchaseRepository.save(purchase);
    }
}