package com.inventory.backend.service;

import com.inventory.backend.model.Product;
import com.inventory.backend.model.InventoryTransaction;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.InventoryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    /**
     * SMART SAVE / REACTIVATE
     * If product name exists (even if inactive), it updates and brings it back.
     * This prevents duplicate names and preserves history.
     */
    @Transactional
    public Product saveOrUpdateProduct(Product incoming) {
        return productRepository.findByName(incoming.getName())
            .map(existing -> {
                existing.setActive(true); // Reactivate if it was soft-deleted
                existing.setPrice(incoming.getPrice());
                existing.setPromoPrice(incoming.getPromoPrice());
                existing.setQuantity(incoming.getQuantity());
                existing.setImageUrl(incoming.getImageUrl());
                existing.setDescription(incoming.getDescription());
                return productRepository.save(existing);
            })
            .orElseGet(() -> productRepository.save(incoming));
    }

    /**
     * UPDATE STOCK & LOG TRANSACTION
     */
    @Transactional
    public Product updateStock(Long productId, Integer changeAmount, String type) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        int newQuantity = product.getQuantity() + changeAmount;
        
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock!");
        }

        product.setQuantity(newQuantity);
        Product updatedProduct = productRepository.save(product);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setProduct(updatedProduct);
        transaction.setQuantity(changeAmount); 
        transaction.setDescription(type); 
        transactionRepository.save(transaction);

        return updatedProduct;
    }

    /**
     * SOFT DELETE (The Fix for Error #1451)
     * We do NOT delete the row. We just hide it.
     * This keeps the Foreign Key relationship happy.
     */
    @Transactional
    public void softDeleteProduct(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setActive(false); // Flip the switch to hide it from UI
        productRepository.save(product);
    }
}