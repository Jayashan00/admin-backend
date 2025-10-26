package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.DatasetInfo;
import com.smartwaste.adminbackend.repository.DatasetInfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile; // For file uploads

import java.io.IOException; // For potential file errors
import java.util.List;
import java.util.Optional;

@Service
public class MLService {

    @Autowired
    private DatasetInfoRepository datasetInfoRepository;
    // --- Removed AuditLogService ---


    // Simulate uploading and saving dataset metadata
    public DatasetInfo handleDatasetUpload(MultipartFile file, String description) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("Cannot upload empty file.");
        }
        // Basic validation (e.g., check for CSV type) - optional
        // String contentType = file.getContentType();
        // if (contentType == null || !contentType.equals("text/csv")) {
        //     throw new IllegalArgumentException("Only CSV files are allowed.");
        // }

        // In a real system, save the file to disk or cloud storage here
        System.out.println("Simulating save for file: " + file.getOriginalFilename() + ", Size: " + file.getSize());

        // Save metadata to database
        DatasetInfo datasetInfo = new DatasetInfo(file.getOriginalFilename(), file.getSize(), description);
        DatasetInfo savedInfo = datasetInfoRepository.save(datasetInfo);

        // --- Removed Audit Logging ---

        return savedInfo;
    }

    // Get list of all uploaded dataset metadata
    public List<DatasetInfo> listDatasets() {
        return datasetInfoRepository.findAll(Sort.by(Sort.Direction.DESC, "uploadTimestamp"));
    }

    // Delete dataset metadata (and ideally the file in a real system)
    public boolean deleteDataset(String id) {
        Optional<DatasetInfo> datasetOpt = datasetInfoRepository.findById(id);
        if (datasetOpt.isPresent()) {
            // DatasetInfo dataset = datasetOpt.get(); // No longer needed for logging
            // In a real system, delete the actual file from storage here

            datasetInfoRepository.deleteById(id);
            // --- Removed Audit Logging ---
            return true;
        }
        return false;
    }


    // Simulate triggering model training
    public String triggerModelTraining(String datasetId, String modelType) {
        Optional<DatasetInfo> datasetOpt = datasetInfoRepository.findById(datasetId);
        if (datasetOpt.isEmpty()) {
            return "Error: Dataset not found.";
        }
        DatasetInfo dataset = datasetOpt.get();

        // Simulate training process (e.g., takes a few seconds)
        System.out.println("Simulating training model '" + modelType + "' using dataset: " + dataset.getFilename() + " (ID: " + datasetId + ")");
        try {
            dataset.setStatus("TRAINING");
            datasetInfoRepository.save(dataset);
            Thread.sleep(3000); // Simulate training time (3 seconds)
            dataset.setStatus("TRAINED"); // Mark as trained (simulation)
            datasetInfoRepository.save(dataset);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            dataset.setStatus("ERROR");
            datasetInfoRepository.save(dataset);
            return "Error: Training simulation interrupted.";
        }

        // --- Removed Audit Logging ---

        // In a real system, return model ID, metrics, status, etc.
        return "Simulated training for '" + modelType + "' using dataset '" + dataset.getFilename() + "' completed.";
    }
}