package com.inventory.backend.controller;

import com.inventory.backend.model.Sale;
import com.inventory.backend.model.Product;
import com.inventory.backend.repository.SaleRepository;
import com.inventory.backend.repository.ProductRepository;
import com.inventory.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private ProductService productService;

    @GetMapping
    public List<Sale> getAllSales() { 
        // Returns the history for the Admin
        return saleRepository.findAll(); 
    }

  @PostMapping
@Transactional
public Sale createSale(
    @RequestBody Sale sale, 
    @RequestParam Long productId, 
    @RequestParam Integer quantitySold, // This is the name from the request URL
    @RequestParam String paymentMethod
) {
    Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

    // FIX: Match the variable name in Sale.java
    sale.setProductId(productId);
    sale.setQuantity(quantitySold); 
    sale.setPaymentMethod(paymentMethod);
    sale.setStatus("COMPLETED");

    Double autoTotal = product.getPrice() * quantitySold;
    sale.setTotalAmount(autoTotal);

    productService.updateStock(productId, -quantitySold, "SALE");

    return saleRepository.save(sale);
}
}