package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.Alert;
import com.smartwaste.adminbackend.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

// import java.time.LocalDateTime; // Not needed directly here anymore
import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    // Method to create a new alert (no changes)
    public Alert createAlert(Alert.AlertType type, String message, String relatedEntityId) {
        Alert newAlert = new Alert(type, message, relatedEntityId);
        System.out.println("ALERT CREATED: " + message); // Log alert creation
        return alertRepository.save(newAlert);
    }

    // Method to get all currently active (unresolved) alerts (no changes)
    public List<Alert> getUnresolvedAlerts() {
        return alertRepository.findByResolvedFalseOrderByTimestampDesc();
    }

    // ++ NEW METHOD: Get resolved alerts ++
    public List<Alert> getResolvedAlerts() {
        return alertRepository.findByResolvedTrueOrderByTimestampDesc();
    }


    // Method to mark an alert as resolved (no changes)
    public Optional<Alert> resolveAlert(String alertId) {
        Optional<Alert> optionalAlert = alertRepository.findById(alertId);
        if (optionalAlert.isPresent()) {
            Alert alert = optionalAlert.get();
            alert.setResolved(true);
            return Optional.of(alertRepository.save(alert));
        }
        return Optional.empty();
    }
}