package com.inventory.backend.repository;

import com.inventory.backend.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    
    // This will only return suppliers where active is true
    List<Supplier> findAllByActiveTrue();
}