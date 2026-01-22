package com.inventory.backend.controller;

import com.inventory.backend.model.Sale;
import com.inventory.backend.model.Product;
import com.inventory.backend.repository.SaleRepository;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.service.ProductService; // 1. IMPORT the service
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
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService; // 2. INJECT the service

    @GetMapping
    public List<Sale> getAllSales() { 
        return saleRepository.findAll(); 
    }

    @PostMapping
    @Transactional
    public Sale createSale(@RequestBody Sale sale, @RequestParam Long productId, @RequestParam Integer quantitySold) {
        
        // 1. Find the product for calculation
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // 2. AUTO-CALCULATE TOTAL
        Double autoTotal = product.getPrice() * quantitySold;
        sale.setTotalAmount(autoTotal);

        // 3. USE THE SERVICE (This handles stock deduction AND the Transaction Log)
        // We pass -quantitySold because a sale reduces stock
        productService.updateStock(productId, -quantitySold, "SALE");

        // 4. Save the sale record
        return saleRepository.save(sale);
    }
}