package com.inventory.backend.controller;

import com.inventory.backend.model.Supplier;
import com.inventory.backend.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    // 1. UPDATED: Only fetch suppliers where active = true
    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAllByActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplierById(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        // Ensure new suppliers are active by default
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier details) {
        return supplierRepository.findById(id)
                .map(supplier -> {
                    supplier.setName(details.getName());
                    supplier.setEmail(details.getEmail());
                    supplier.setPhone(details.getPhone());
                    supplier.setAddress(details.getAddress());
                    supplier.setCategory(details.getCategory());
                    return ResponseEntity.ok(supplierRepository.save(supplier));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. UPDATED: SOFT DELETE 
    // We no longer use a try-catch for FK errors because we aren't actually deleting the row!
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        return supplierRepository.findById(id)
                .map(supplier -> {
                    supplier.setActive(false); // Flip the flag
                    supplierRepository.save(supplier); // Save the change
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}