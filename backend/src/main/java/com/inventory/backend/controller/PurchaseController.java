package com.inventory.backend.controller;

import com.inventory.backend.model.Purchase;
import com.inventory.backend.model.Product;
import com.inventory.backend.model.Supplier;
import com.inventory.backend.repository.PurchaseRepository;
import com.inventory.backend.repository.SupplierRepository;
import com.inventory.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "*")
public class PurchaseController {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private SupplierRepository supplierRepository;

    @GetMapping
    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    /**
     * Scenario: User selects "New Product" in the UI.
     * We save the product first, then process the purchase.
     */
    @PostMapping("/new-product")
    @Transactional
    public ResponseEntity<?> createPurchaseWithNewProduct(@RequestBody Purchase purchase) {
        try {
            // The product object sent from UI now includes the category
            Product savedProduct = productService.saveOrUpdateProduct(purchase.getProduct());
            purchase.setProduct(savedProduct);
            return processPurchase(purchase);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Scenario: Restocking an existing product.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createPurchase(@RequestBody Purchase purchase) {
        try {
            return processPurchase(purchase);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    private ResponseEntity<Purchase> processPurchase(Purchase purchase) {
        // 1. Calculate Financials
        if (purchase.getUnitPrice() != null && purchase.getQuantity() != null) {
            purchase.setTotalAmount(purchase.getUnitPrice() * purchase.getQuantity());
        }

        // 2. Resolve Supplier for the audit log
        String supplierDisplayName = "Restock";
        if (purchase.getSupplier() != null && purchase.getSupplier().getId() != null) {
            supplierDisplayName = supplierRepository.findById(purchase.getSupplier().getId())
                    .map(Supplier::getName)
                    .orElse("Unknown Supplier");
        }

        // --- 3. AUTO-SYNC CATEGORY ---
        // We force the Product table to match the Category chosen in the Purchase form
        if (purchase.getProduct() != null && purchase.getCategory() != null) {
            // Fetch current product to ensure we are updating the correct reference
            Product productToUpdate = purchase.getProduct();
            productToUpdate.setCategory(purchase.getCategory());
            
            // Push the update to the products table
            productService.saveOrUpdateProduct(productToUpdate);
        }

        // 4. Update Inventory Levels & Log the Transaction
        // This usually adds quantity and creates an 'IN' record in history
        productService.updateStock(
            purchase.getProduct().getId(), 
            purchase.getQuantity(), 
            "PURCHASE FROM: " + supplierDisplayName,
            purchase.getReference(), 
            purchase.getUser()        
        );

        // 5. Finalize Purchase Entry
        return ResponseEntity.ok(purchaseRepository.save(purchase));
    }
}