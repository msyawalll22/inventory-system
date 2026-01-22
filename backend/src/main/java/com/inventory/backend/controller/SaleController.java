package com.inventory.backend.controller;

import com.inventory.backend.model.Sale;
import com.inventory.backend.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SaleController {
    @Autowired
    private SaleRepository saleRepository;

    @GetMapping
    public List<Sale> getAllSales() { return saleRepository.findAll(); }

    @PostMapping
    public Sale createSale(@RequestBody Sale sale) { return saleRepository.save(sale); }
}