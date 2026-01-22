package com.inventory.backend.service;

import com.inventory.backend.model.Product;
import com.inventory.backend.model.InventoryTransaction; // Ensure this exists
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.InventoryTransactionRepository; // You'll need this
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @Transactional
    public Product updateStock(Long productId, Integer changeAmount, String type) {
        // 1. Update the Product Stock
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        int newQuantity = product.getQuantity() + changeAmount;
        
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock!");
        }

        product.setQuantity(newQuantity);
        Product updatedProduct = productRepository.save(product);
// 2. CREATE THE TRANSACTION LOG
InventoryTransaction transaction = new InventoryTransaction();
transaction.setProduct(updatedProduct);

// Use 'setQuantity' instead of 'setQuantityChange'
transaction.setQuantity(changeAmount); 

// Use 'setDescription' instead of 'setTransactionType' 
// Or you can map 'type' to description
transaction.setDescription(type); 

// Note: Your model has @PrePersist for createdAt, 
// so you don't even need to set it manually here!
transactionRepository.save(transaction);

        return updatedProduct;
    }
}