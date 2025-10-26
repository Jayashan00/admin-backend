package com.smartwaste.adminbackend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "datasets")
@Data
@NoArgsConstructor
public class DatasetInfo {

    @Id
    private String id;
    private String filename;
    private long size; // In bytes
    private LocalDateTime uploadTimestamp;
    private String description; // Optional description
    private String status; // e.g., "UPLOADED", "PROCESSING", "READY"

    public DatasetInfo(String filename, long size, String description) {
        this.filename = filename;
        this.size = size;
        this.description = description;
        this.uploadTimestamp = LocalDateTime.now();
        this.status = "UPLOADED"; // Initial status
    }
}