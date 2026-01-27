package com.inventory.backend.repository;

import com.inventory.backend.model.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    
    @Transactional
    @Modifying // Tells Spring this query changes data
    void deleteByProductId(Long productId);

    @Query("SELECT t FROM InventoryTransaction t ORDER BY t.createdAt DESC")
    List<InventoryTransaction> findAllSorted();
}