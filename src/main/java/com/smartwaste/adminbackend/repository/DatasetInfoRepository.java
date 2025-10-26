package com.smartwaste.adminbackend.repository;

import com.smartwaste.adminbackend.model.DatasetInfo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasetInfoRepository extends MongoRepository<DatasetInfo, String> {
    // Find datasets by filename if needed later
    // Optional<DatasetInfo> findByFilename(String filename);
}