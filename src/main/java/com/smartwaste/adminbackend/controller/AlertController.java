package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.Alert;
import com.smartwaste.adminbackend.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Ensure PreAuthorize is imported
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "http://localhost:5173") // Or use global CORS
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')") // Restrict entire controller
public class AlertController {

    @Autowired
    private AlertService alertService;

    // GET /api/v1/alerts/unresolved - Fetches active alerts (no changes)
    @GetMapping("/unresolved")
    public ResponseEntity<List<Alert>> getUnresolvedAlerts() {
        List<Alert> alerts = alertService.getUnresolvedAlerts();
        return ResponseEntity.ok(alerts);
    }

    // ++ NEW ENDPOINT: GET /api/v1/alerts/resolved - Fetches resolved alerts ++
    @GetMapping("/resolved")
    public ResponseEntity<List<Alert>> getResolvedAlerts() {
        List<Alert> alerts = alertService.getResolvedAlerts();
        return ResponseEntity.ok(alerts);
    }


    // POST /api/v1/alerts/{id}/resolve - Marks an alert as resolved (no changes)
    @PostMapping("/{id}/resolve")
    public ResponseEntity<Alert> resolveAlert(@PathVariable String id) {
        return alertService.resolveAlert(id)
                .map(ResponseEntity::ok) // Return updated alert if successful
                .orElse(ResponseEntity.notFound().build()); // Return 404 if alert not found
    }
}