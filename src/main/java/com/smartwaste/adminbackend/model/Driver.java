package com.smartwaste.adminbackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "drivers")
@Data
public class Driver {

    @Id
    private String id;

    private String name; // e.g., "K. Perera"
    private String licenseNumber; // e.g., "B1234567"
    private String contactNumber; // e.g., "0771234567"

    // We will link this to a truck later
    private String assignedTruckId; // This will store the 'id' of a Truck

    private DriverStatus status;

    public enum DriverStatus {
        OFF_DUTY,
        ON_DUTY_IDLE, // On duty, but not in a truck
        DRIVING
    }
}