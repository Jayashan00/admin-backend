package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.Bin;
import com.smartwaste.adminbackend.service.BinService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bins") // All URLs in this file will start with this
@CrossOrigin(origins = "http://localhost:5173") // <--- THIS IS THE FIX
public class BinController {
//...{

    @Autowired
    private BinService binService;

    // GET /api/v1/bins  (Get all bins)
    @GetMapping
    public List<Bin> getAllBins() {
        return binService.getAllBins();
    }

    // GET /api/v1/bins/{id}  (Get a single bin by its ID)
    @GetMapping("/{id}")
    public ResponseEntity<Bin> getBinById(@PathVariable String id) {
        return binService.getBinById(id)
                .map(ResponseEntity::ok) // 200 OK
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }

    // POST /api/v1/bins  (Create a new bin)
    @PostMapping
    public ResponseEntity<Bin> createBin(@RequestBody Bin bin) {
        Bin createdBin = binService.createBin(bin);
        return new ResponseEntity<>(createdBin, HttpStatus.CREATED); // 201 Created
    }

    // PUT /api/v1/bins/{id}  (Update a bin)
    @PutMapping("/{id}")
    public ResponseEntity<Bin> updateBin(@PathVariable String id, @RequestBody Bin binDetails) {
        return binService.updateBin(id, binDetails)
                .map(ResponseEntity::ok) // 200 OK
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }

    // DELETE /api/v1/bins/{id}  (Delete a bin)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBin(@PathVariable String id) {
        if (binService.deleteBin(id)) {
            return ResponseEntity.noContent().build(); // 204 No Content
        }
        return ResponseEntity.notFound().build(); // 404 Not Found
    }
}