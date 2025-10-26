package com.smartwaste.adminbackend.controller;

// import com.smartwaste.adminbackend.service.BinService; // No longer needed directly for prediction
import com.smartwaste.adminbackend.service.PredictionService; // ++ Import PredictionService ++
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
// @CrossOrigin handled globally
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
public class AnalyticsController {

    // @Autowired // Remove BinService if only used for old prediction
    // private BinService binService;

    @Autowired // ++ Inject PredictionService ++
    private PredictionService predictionService;

    // GET /api/v1/analytics/predict/bin/{binId}?hours={hours}
    // Uses the ML model if trained, otherwise might fallback or error
    @GetMapping("/predict/bin/{binId}")
    public ResponseEntity<?> predictBinFillLevel(
            @PathVariable String binId,
            @RequestParam(defaultValue = "4") int hours) {

        if (hours <= 0 || hours > 48) { // Allow longer predictions maybe?
            return ResponseEntity.badRequest().body(Map.of("message", "Prediction hours must be between 1 and 48."));
        }

        return predictionService.predictBinFillLevel(binId, hours)
                .map(prediction -> ResponseEntity.ok(Map.of(
                        "binId", binId,
                        "hoursAhead", hours,
                        "predictedFillLevel", prediction,
                        "type", "ML Prediction" // Indicate it's from the model
                )))
                // Return 404 if bin not found, or maybe 409 Conflict if model not trained?
                .orElse(ResponseEntity.status(409).body(Map.of("message", "Prediction failed. Bin not found or model not trained yet.")));
    }


    // ++ NEW ENDPOINT: POST /api/v1/analytics/train/bin/{binId} ++
    // Trigger training for a specific bin (using simulated data for now)
    @PostMapping("/train/bin/{binId}")
    public ResponseEntity<?> trainBinModel(@PathVariable String binId) {
        try {
            String result = predictionService.trainBinFillModel(binId);
            if (result.startsWith("Error:")) {
                return ResponseEntity.badRequest().body(Map.of("message", result));
            }
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            System.err.println("Unexpected error during training trigger for bin " + binId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not trigger training due to server error."));
        }
    }

    // Add more analytics/prediction endpoints here
}