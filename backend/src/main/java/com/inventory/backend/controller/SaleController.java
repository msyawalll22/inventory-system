package com.inventory.backend.controller;

import com.inventory.backend.model.Sale;
import com.inventory.backend.model.SaleItem;
import com.inventory.backend.model.Product;
import com.inventory.backend.model.User;
import com.inventory.backend.repository.SaleRepository;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.repository.UserRepository;
import com.inventory.backend.service.ProductService;
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
    private UserRepository userRepository;

    @Autowired
    private ProductService productService;

    @GetMapping
    public List<Sale> getAllSales() { 
        return saleRepository.findAll(); 
    }

    @PostMapping
    @Transactional
    public Sale createSale(@RequestBody Sale saleRequest, @RequestParam Long userId) {
        // 1. Validate User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // 2. Setup the Master Sale record
        saleRequest.setUser(user);
        saleRequest.setStatus("COMPLETED");
        
        // Initial save to generate the ID needed for the reference
        Sale savedSale = saleRepository.save(saleRequest);

        // 3. Generate Invoice Reference
        String invoiceRef = "SLS-" + String.format("%05d", savedSale.getId());
        savedSale.setReference(invoiceRef);

        // 4. Process Items and Calculate Total
        double runningTotal = 0;
        
        for (SaleItem item : saleRequest.getItems()) {
            // Fetch product to get current price and validate existence
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

            // Link item to the master sale
            item.setSale(savedSale);
            item.setUnitPrice(product.getPrice());
            
            runningTotal += (product.getPrice() * item.getQuantity());

            // 5. Update Stock for each item in the basket
            productService.updateStock(
                product.getId(), 
                -item.getQuantity(), 
                "SALE", 
                invoiceRef, 
                user
            );
        }

        // 6. Update Total and Save Final Sale
        savedSale.setTotalAmount(runningTotal);
        return saleRepository.save(savedSale);
    }
}