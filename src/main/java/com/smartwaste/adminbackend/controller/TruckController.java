package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.Truck;
import com.smartwaste.adminbackend.service.TruckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trucks") // The base URL for all truck APIs
@CrossOrigin(origins = "http://localhost:5173") // Don't forget this!
public class TruckController {

    @Autowired
    private TruckService truckService;

    // GET /api/v1/trucks
    @GetMapping
    public List<Truck> getAllTrucks() {
        return truckService.getAllTrucks();
    }

    // GET /api/v1/trucks/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Truck> getTruckById(@PathVariable String id) {
        return truckService.getTruckById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/v1/trucks
    @PostMapping
    public ResponseEntity<Truck> createTruck(@RequestBody Truck truck) {
        Truck createdTruck = truckService.createTruck(truck);
        return new ResponseEntity<>(createdTruck, HttpStatus.CREATED);
    }

    // PUT /api/v1/trucks/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Truck> updateTruck(@PathVariable String id, @RequestBody Truck truckDetails) {
        return truckService.updateTruck(id, truckDetails)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/v1/trucks/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTruck(@PathVariable String id) {
        if (truckService.deleteTruck(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}