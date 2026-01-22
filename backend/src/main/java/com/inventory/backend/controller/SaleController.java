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
@Transactional
public Sale createSale(@RequestBody Sale sale, @RequestParam Long productId, @RequestParam Integer quantitySold) {
    
    // 1. Find the product
    Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

    // 2. Check stock
    if (product.getQuantity() < quantitySold) {
        throw new RuntimeException("Insufficient stock!");
    }

    // 3. AUTO-CALCULATE TOTAL: Price from DB * Quantity Sold
    Double autoTotal = product.getPrice() * quantitySold;
    sale.setTotalAmount(autoTotal); // Overwrites whatever we send in PowerShell

    // 4. Deduct stock
    product.setQuantity(product.getQuantity() - quantitySold);
    productRepository.save(product);

    // 5. Save sale
    return saleRepository.save(sale);
}
}