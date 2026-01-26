package com.inventory.backend.service;

import com.inventory.backend.model.Product;
import com.inventory.backend.model.InventoryTransaction;
import com.inventory.backend.model.User;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.InventoryTransactionRepository;
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

    /**
     * SMART SAVE / REACTIVATE
     * Updates existing products or saves new ones.
     */
    @Transactional
    public Product saveOrUpdateProduct(Product incoming) {
        return productRepository.findByName(incoming.getName())
            .map(existing -> {
                existing.setActive(true);
                existing.setPrice(incoming.getPrice());
                existing.setQuantity(incoming.getQuantity());
                existing.setImageUrl(incoming.getImageUrl());
                existing.setDescription(incoming.getDescription());
                return productRepository.save(existing);
            })
            .orElseGet(() -> productRepository.save(incoming));
    }

    /**
     * OLD VERSION (Overloaded)
     * Keeps ProductController and SaleController working by redirecting to the main method
     * with null for the new reference and user fields.
     */
    @Transactional
    public Product updateStock(Long productId, Integer changeAmount, String type) {
        return updateStock(productId, changeAmount, type, null, null);
    }

    /**
     * MAIN VERSION (Overloaded)
     * Used by PurchaseController to handle Reference and User data for the transaction log.
     */
    @Transactional
    public Product updateStock(Long productId, Integer changeAmount, String type, String reference, User user) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        int newQuantity = product.getQuantity() + changeAmount;
        
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock!");
        }

        product.setQuantity(newQuantity);
        Product updatedProduct = productRepository.save(product);

        // --- Log to inventory_transactions table ---
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(updatedProduct); // Maps to item_id in DB
        transaction.setQuantity(changeAmount); 
        transaction.setDescription(type); 
        transaction.setReference(reference);    // The manual reference from UI
        transaction.setUser(user);              // The logged-in user link
        transaction.setCreatedAt(LocalDateTime.now()); 
        
        transactionRepository.save(transaction);

        return updatedProduct;
    }

    /**
     * SOFT DELETE
     * Hides product from UI without breaking transaction history.
     */
    @Transactional
    public void softDeleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setActive(false);
        productRepository.save(product);
    }
}