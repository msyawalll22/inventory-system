package com.inventory.backend.controller;

import com.inventory.backend.model.Product;
import com.inventory.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    // 1. Get All Products (READ)
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // 2. Get Single Product by ID (READ)
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id).orElse(null);
    }

    // 3. Add New Product (CREATE)
    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    // 4. Update Product Details (Standard UPDATE)
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setQuantity(productDetails.getQuantity());
        
        return productRepository.save(product);
    }

    // NEW Logic: Specific endpoint for stock adjustments (Incremental)
    // This allows you to send +5 to add stock or -3 to reduce stock
    @PatchMapping("/{id}/stock")
    public Product adjustStock(@PathVariable Long id, @RequestParam Integer amount) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        int newQuantity = product.getQuantity() + amount;
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock level!");
        }
        
        product.setQuantity(newQuantity);
        return productRepository.save(product);
    }

    // 5. Delete Product (DELETE)
    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable Long id) {
        productRepository.deleteById(id);
        return "Product deleted successfully";
    }
}