package com.inventory.backend.service;

import com.inventory.backend.model.Product;
import com.inventory.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public Product updateStock(Long productId, Integer changeAmount) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        int newQuantity = product.getQuantity() + changeAmount;
        
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock!");
        }

        product.setQuantity(newQuantity);
        return productRepository.save(product);
    }
}