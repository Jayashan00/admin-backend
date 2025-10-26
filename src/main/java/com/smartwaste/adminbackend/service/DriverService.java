package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.Driver;
import com.smartwaste.adminbackend.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    public Optional<Driver> getDriverById(String id) {
        return driverRepository.findById(id);
    }

    public Driver createDriver(Driver driver) {
        // Set default status when creating a new driver
        if (driver.getStatus() == null) {
            driver.setStatus(Driver.DriverStatus.OFF_DUTY);
        }
        return driverRepository.save(driver);
    }

    public Optional<Driver> updateDriver(String id, Driver driverDetails) {
        Optional<Driver> optionalDriver = driverRepository.findById(id);
        if (optionalDriver.isPresent()) {
            Driver existingDriver = optionalDriver.get();
            existingDriver.setName(driverDetails.getName());
            existingDriver.setLicenseNumber(driverDetails.getLicenseNumber());
            existingDriver.setContactNumber(driverDetails.getContactNumber());
            existingDriver.setAssignedTruckId(driverDetails.getAssignedTruckId());
            existingDriver.setStatus(driverDetails.getStatus());

            return Optional.of(driverRepository.save(existingDriver));
        }
        return Optional.empty();
    }

    public boolean deleteDriver(String id) {
        if (driverRepository.existsById(id)) {
            driverRepository.deleteById(id);
            return true;
        }
        return false;
    }
}