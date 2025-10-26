package com.smartwaste.adminbackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.smartwaste.adminbackend.model.Bin.Location;
import java.util.List; // +++ ADD THIS IMPORT

@Document(collection = "trucks")
@Data
public class Truck {

    @Id
    private String id;
    private String licensePlate;
    private Double capacity;
    private Double currentFillLevel;
    private TruckStatus status;
    private Location currentLocation;

    // +++ ADD THIS FIELD +++
    private List<List<Double>> currentRoute;

    public enum TruckStatus {
        IDLE,
        EN_ROUTE,
        COLLECTING,
        RETURNING,
        MAINTENANCE
    }
}