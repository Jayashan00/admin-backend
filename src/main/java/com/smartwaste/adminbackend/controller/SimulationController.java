package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.service.TruckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/simulation")
@CrossOrigin(origins = "http://localhost:5173")
public class SimulationController {

    @Autowired
    private TruckService truckService;

    @PostMapping("/tick")
    public ResponseEntity<String> runSimulationTick() {
        truckService.simulateTruckMovement();
        return ResponseEntity.ok("Simulation tick processed");
    }
}
