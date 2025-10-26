package com.smartwaste.adminbackend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "admin_users")
@Data
public class AdminUser {

    // Define standard roles as constants
    public static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";
    public static final String ROLE_ADMIN = "ROLE_ADMIN"; // Standard admin
    public static final String ROLE_OPERATOR = "ROLE_OPERATOR"; // Limited access (future)

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;
    private String password; // Hashed password
    private String role; // Stores one of the constants above
}