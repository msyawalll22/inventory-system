package com.inventory.backend.controller;

import com.inventory.backend.model.Sale;
import com.inventory.backend.model.Product;
import com.inventory.backend.repository.SaleRepository;
import com.inventory.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SaleController {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private ProductRepository productRepository; // Needed to update stock

    @GetMapping
    public List<Sale> getAllSales() { 
        return saleRepository.findAll(); 
    }

    @PostMapping
    @Transactional // Ensures both sale record and stock update happen together
    public Sale createSale(@RequestBody Sale sale, @RequestParam Long productId, @RequestParam Integer quantitySold) {
        
        // 1. Find the product in the database
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        // 2. Check if enough stock exists
        if (product.getQuantity() < quantitySold) {
            throw new RuntimeException("Insufficient stock! Only " + product.getQuantity() + " left.");
        }

        // 3. Deduct the quantity
        product.setQuantity(product.getQuantity() - quantitySold);
        productRepository.save(product);

        // 4. Save the sale record
        return saleRepository.save(sale);
    }
}