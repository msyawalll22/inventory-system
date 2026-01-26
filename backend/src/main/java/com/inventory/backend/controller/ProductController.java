package com.inventory.backend.controller;

import com.inventory.backend.model.Product;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    // 1. FIXED: Now calls the specific query for active products only
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAllByActiveTrue();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id).orElse(null);
    }

    // 2. FIXED: Uses the Service's saveOrUpdateProduct to handle reactivations
    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        Product savedProduct = productService.saveOrUpdateProduct(product);
        
        if (savedProduct.getQuantity() != null && savedProduct.getQuantity() > 0) {
            productService.updateStock(savedProduct.getId(), savedProduct.getQuantity(), "INITIAL_STOCK");
        }
        
        return savedProduct;
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setImageUrl(productDetails.getImageUrl());
        product.setQuantity(productDetails.getQuantity());
        
        // When updating, we ensure the product is set to active 
        product.setActive(true);
        
        return productRepository.save(product);
    }

    @PatchMapping("/{id}/stock")
    public Product adjustStock(@PathVariable Long id, @RequestParam Integer amount) {
        String type = (amount > 0) ? "RESTOCK" : "ADJUSTMENT";
        return productService.updateStock(id, amount, type);
    }

    // 3. FIXED: Calls softDeleteProduct to avoid Foreign Key errors
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        try {
            productService.softDeleteProduct(id);
            return ResponseEntity.ok("Product archived successfully. History preserved.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}