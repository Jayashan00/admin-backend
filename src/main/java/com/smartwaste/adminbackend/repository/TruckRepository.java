package com.smartwaste.adminbackend.repository;

import com.smartwaste.adminbackend.model.Truck;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TruckRepository extends MongoRepository<Truck, String> {
    // You can add custom queries later, e.g.:
    // List<Truck> findByStatus(Truck.TruckStatus status);
}