package com.inventory.backend.controller;

import com.inventory.backend.model.Product;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.service.ProductService; // 1. Import Service
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService; // 2. Inject Service

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productRepository.findById(id).orElse(null);
    }

    // 3. Add New Product (Initial Stock Logged as PURCHASE)
    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        // Save the product first to get an ID
        Product savedProduct = productRepository.save(product);
        
        // If the new product has initial stock, log it in history
        if (savedProduct.getQuantity() > 0) {
            productService.updateStock(savedProduct.getId(), savedProduct.getQuantity(), "PURCHASE");
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
        
        // Note: We usually don't update quantity via PutMapping 
        // if we want accurate transaction logs; we use adjustStock instead.
        product.setQuantity(productDetails.getQuantity());
        
        return productRepository.save(product);
    }

    // 4. Adjust Stock (Triggers the Transaction Log)
    @PatchMapping("/{id}/stock")
    public Product adjustStock(@PathVariable Long id, @RequestParam Integer amount) {
        // Determine the type based on the amount
        String type = (amount > 0) ? "PURCHASE" : "ADJUSTMENT";
        
        // Use the service to handle the logic and the history record
        return productService.updateStock(id, amount, type);
    }

    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable Long id) {
        productRepository.deleteById(id);
        return "Product deleted successfully";
    }
}