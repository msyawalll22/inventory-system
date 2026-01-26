package com.inventory.backend.controller;

import com.inventory.backend.model.Sale;
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
    public Sale createSale(
        @RequestBody Sale sale, 
        @RequestParam Long productId, 
        @RequestParam Integer quantitySold, 
        @RequestParam String paymentMethod,
        @RequestParam Long userId 
    ) {
        // 1. Validate Product and User exist
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // 2. Set Sale Details
        sale.setUser(user);
        sale.setProductId(productId);
        sale.setQuantity(quantitySold); 
        sale.setPaymentMethod(paymentMethod);
        sale.setStatus("COMPLETED");

        // Calculate total based on current product price
        Double autoTotal = product.getPrice() * quantitySold;
        sale.setTotalAmount(autoTotal);

        // 3. SAVE SALE FIRST (To generate the ID for the reference)
        Sale savedSale = saleRepository.save(sale);

        // 4. Generate Invoice Reference using the new Sale ID
        // String.format("%05d", id) turns 61 into 00061
        String invoiceRef = "SLS-" + String.format("%05d", savedSale.getId());

        // 5. UPDATE STOCK & LOG TRANSACTION
        // We pass ALL 5 arguments to ensure 'reference' and 'user_id' are NOT NULL
        productService.updateStock(
            productId, 
            -quantitySold, 
            "SALE", 
            invoiceRef, 
            user
        );

        return savedSale;
    }
}