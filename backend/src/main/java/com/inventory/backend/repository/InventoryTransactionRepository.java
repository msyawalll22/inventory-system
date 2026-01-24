package com.inventory.backend.repository;

import com.inventory.backend.model.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional; // Import this

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    
    // Add this line inside the interface
    @Transactional
    void deleteByProductId(Long productId);
}