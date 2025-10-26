package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.Truck;
import com.smartwaste.adminbackend.repository.TruckRepository;
import com.smartwaste.adminbackend.routing.Node;
import com.smartwaste.adminbackend.service.RoutingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/routing")
@CrossOrigin(origins = "http://localhost:5173")
public class RoutingController {

    @Autowired
    private RoutingService routingService;

    @Autowired
    private TruckRepository truckRepository;

    @PostMapping("/generate")
    public ResponseEntity<List<List<Double>>> generateRoute(@RequestBody Map<String, String> payload) {
        String truckId = payload.get("truckId");
        if (truckId == null || truckId.isEmpty()) {
            return ResponseEntity.badRequest().body(null); // No truck ID provided
        }

        try {
            List<Node> routeNodes = routingService.generateOptimalRoute(truckId);

            List<List<Double>> routeCoordinates = routeNodes.stream()
                    .map(node -> List.of(node.getLocation().getLatitude(), node.getLocation().getLongitude()))
                    .collect(Collectors.toList());

            Truck truck = truckRepository.findById(truckId)
                    .orElseThrow(() -> new RuntimeException("Truck not found after route generation"));
            truck.setCurrentRoute(routeCoordinates);
            truck.setStatus(Truck.TruckStatus.EN_ROUTE);
            truckRepository.save(truck);

            return ResponseEntity.ok(routeCoordinates);
        } catch (RuntimeException e) { // Catch specific routing errors
            System.err.println("Routing Error: " + e.getMessage());
            // Return a specific error status, maybe 404 if truck not found, 400 if no bins etc.
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) { // Catch unexpected errors
            System.err.println("Unexpected Error during routing: " + e.getMessage());
            e.printStackTrace(); // Log the full stack trace for debugging
            return ResponseEntity.internalServerError().body(null);
        }
    }
}