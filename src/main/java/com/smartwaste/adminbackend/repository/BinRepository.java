package com.smartwaste.adminbackend.repository;

import com.smartwaste.adminbackend.model.Bin;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

// This connects to the Bin model and gives us functions like
// findAll(), findById(), save(), deleteById() for free!
@Repository
public interface BinRepository extends MongoRepository<Bin, String> {
    // We can add custom finder methods later, e.g.:
    // List<Bin> findByStatus(Bin.BinStatus status);
}