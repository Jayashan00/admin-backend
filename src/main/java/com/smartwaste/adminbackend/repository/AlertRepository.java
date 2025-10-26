package com.smartwaste.adminbackend.repository;

import com.smartwaste.adminbackend.model.Alert;
import org.springframework.data.domain.Sort; // Ensure Sort is imported
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends MongoRepository<Alert, String> {
    // Find alerts that haven't been marked as resolved yet, newest first
    List<Alert> findByResolvedFalseOrderByTimestampDesc();

    // ++ NEW METHOD: Find alerts that *have* been resolved, newest first ++
    List<Alert> findByResolvedTrueOrderByTimestampDesc();
}