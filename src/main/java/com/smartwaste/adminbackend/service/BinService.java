package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.Alert;
import com.smartwaste.adminbackend.model.Bin;
import com.smartwaste.adminbackend.repository.BinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random; // Make sure this import exists

@Service
public class BinService {

    @Autowired
    private BinRepository binRepository;
    @Autowired
    private AlertService alertService;

    // Threshold for bin alerts
    private static final double BIN_ALERT_THRESHOLD = 85.0;

    // --- getAllBins, getBinById, deleteBin remain the same ---
    public List<Bin> getAllBins() { return binRepository.findAll(); }
    public Optional<Bin> getBinById(String id) { return binRepository.findById(id); }
    public boolean deleteBin(String id) {
        if (binRepository.existsById(id)) {
            binRepository.deleteById(id);
            return true;
        } return false;
    }


    // POST (Create) a new bin
    public Bin createBin(Bin bin) {
        if (bin.getFillLevel() == null) {
            bin.setFillLevel(Math.random() * 100);
        }
        Bin savedBin = binRepository.save(bin);
        System.out.println("Checking alert for newly created bin: " + savedBin.getId() + " with fill level: " + savedBin.getFillLevel());
        checkAndCreateBinAlert(savedBin);
        return savedBin;
    }

    // PUT (Update) an existing bin
    public Optional<Bin> updateBin(String id, Bin binDetails) {
        Optional<Bin> optionalBin = binRepository.findById(id);
        if (optionalBin.isPresent()) {
            Bin existingBin = optionalBin.get();
            Double oldFillLevel = existingBin.getFillLevel();

            existingBin.setName(binDetails.getName());
            existingBin.setLocation(binDetails.getLocation());
            existingBin.setCapacity(binDetails.getCapacity());
            existingBin.setFillLevel(binDetails.getFillLevel());
            existingBin.setStatus(binDetails.getStatus());
            existingBin.setWasteType(binDetails.getWasteType());

            if (existingBin.getFillLevel() == null &&
                    (existingBin.getStatus() == Bin.BinStatus.FULL || existingBin.getStatus() == Bin.BinStatus.OVERFLOWING)) {
                existingBin.setFillLevel(90.0);
            }

            Bin updatedBin = binRepository.save(existingBin);
            Double newFillLevel = updatedBin.getFillLevel();

            System.out.println("Checking alert for updated bin: " + updatedBin.getId() +
                    ". Old Level: " + oldFillLevel + ", New Level: " + newFillLevel);

            boolean crossedThreshold = newFillLevel != null && newFillLevel >= BIN_ALERT_THRESHOLD &&
                    (oldFillLevel == null || oldFillLevel < BIN_ALERT_THRESHOLD);

            if (crossedThreshold) {
                System.out.println("Threshold crossed! Creating alert.");
                checkAndCreateBinAlert(updatedBin);
            } else {
                System.out.println("Threshold not crossed or new level is null/below threshold.");
            }
            return Optional.of(updatedBin);
        }
        return Optional.empty();
    }


    // Helper method to create bin alert
    private void checkAndCreateBinAlert(Bin bin) {
        if (bin.getFillLevel() != null && bin.getFillLevel() >= BIN_ALERT_THRESHOLD) {
            String message = String.format("Bin '%s' is nearly full (%.1f%%).",
                    (bin.getName() != null ? bin.getName() : bin.getId()),
                    bin.getFillLevel());
            alertService.createAlert(Alert.AlertType.BIN_NEAR_FULL, message, bin.getId());
        } else {
            System.out.println("Bin " + bin.getId() + " fill level (" + bin.getFillLevel() + ") is below threshold or null. No alert created.");
        }
    }

    // ++ NEW METHOD: Simulate Fill Level Prediction ++
    public Optional<Double> predictFillLevel(String binId, int hoursAhead) {
        Optional<Bin> optionalBin = binRepository.findById(binId);
        if (optionalBin.isPresent()) {
            Bin bin = optionalBin.get();
            Double currentLevel = bin.getFillLevel();
            Random random = new Random(); // Create Random instance if not already a field

            if (currentLevel == null) {
                currentLevel = 0.0;
            }

            // Simulate average increase per hour (e.g., 2-5%) with some randomness
            double simulatedIncreaseRate = 2.0 + (random.nextDouble() * 3.0); // % per hour
            double predictedIncrease = simulatedIncreaseRate * hoursAhead * (0.8 + random.nextDouble() * 0.4); // Add +/- 20% randomness

            double predictedLevel = currentLevel + predictedIncrease;

            // Clamp prediction between 0 and 100
            predictedLevel = Math.max(0.0, Math.min(100.0, predictedLevel));

            System.out.println("Predicted fill level for bin " + binId + " in " + hoursAhead + " hours: " + predictedLevel);
            return Optional.of(predictedLevel);

        } else {
            return Optional.empty(); // Bin not found
        }
    }
}