package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.DatasetInfo;
import com.smartwaste.adminbackend.service.MLService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ml")
// @CrossOrigin handled globally
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')") // Restrict access
public class MLController {

    @Autowired
    private MLService mlService;

    // POST /api/v1/ml/datasets/upload - Upload a dataset file
    @PostMapping("/datasets/upload")
    public ResponseEntity<?> uploadDataset(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false, defaultValue = "") String description) {
        try {
            DatasetInfo savedInfo = mlService.handleDatasetUpload(file, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedInfo);
        } catch (IOException | IllegalArgumentException e) {
            System.err.println("Dataset upload error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Unexpected dataset upload error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not upload dataset due to server error."));
        }
    }

    // GET /api/v1/ml/datasets - List all dataset metadata
    @GetMapping("/datasets")
    public ResponseEntity<List<DatasetInfo>> listDatasets() {
        return ResponseEntity.ok(mlService.listDatasets());
    }

    // DELETE /api/v1/ml/datasets/{id} - Delete a dataset
    @DeleteMapping("/datasets/{id}")
    public ResponseEntity<Void> deleteDataset(@PathVariable String id) {
        if (mlService.deleteDataset(id)) {
            return ResponseEntity.noContent().build(); // 204 Success
        } else {
            return ResponseEntity.notFound().build(); // 404 Not Found
        }
    }

    // POST /api/v1/ml/train - Trigger model training (simulation)
    @PostMapping("/train")
    public ResponseEntity<?> trainModel(@RequestBody Map<String, String> payload) {
        String datasetId = payload.get("datasetId");
        String modelType = payload.get("modelType"); // e.g., "BinFillForecasting"

        if (datasetId == null || datasetId.isEmpty() || modelType == null || modelType.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "datasetId and modelType are required."));
        }

        try {
            String result = mlService.triggerModelTraining(datasetId, modelType);
            if (result.startsWith("Error:")) {
                return ResponseEntity.badRequest().body(Map.of("message", result));
            }
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            System.err.println("Unexpected training trigger error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not trigger training due to server error."));
        }
    }
}