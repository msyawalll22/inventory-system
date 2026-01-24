package com.inventory.backend.repository;

import com.inventory.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    // Only fetch products that aren't "deleted"
    List<Product> findAllByActiveTrue();

    // Used for the "Smart Add" (reactivation)
    Optional<Product> findByName(String name);
}