package com.smartwaste.adminbackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime; // Use Java 8+ time

@Document(collection = "alerts")
@Data
public class Alert {

    @Id
    private String id;
    private AlertType type;
    private String message;
    private String relatedEntityId; // ID of the Bin or Truck
    private LocalDateTime timestamp;
    private boolean resolved; // To track if the alert has been acknowledged/handled

    public enum AlertType {
        BIN_NEAR_FULL, // e.g., > 85%
        BIN_OVERFLOWING, // (Could add later if sensors detect > 100%)
        TRUCK_OVERLOADED, // e.g., > 95%
        TRUCK_IDLE_TOO_LONG, // (Future enhancement)
        ROUTE_DELAY // (Future enhancement)
    }

    // Constructor for easier creation
    public Alert(AlertType type, String message, String relatedEntityId) {
        this.type = type;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
        this.timestamp = LocalDateTime.now(); // Set timestamp on creation
        this.resolved = false; // New alerts are unresolved
    }
}