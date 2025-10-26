package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.AdminUser;
import com.smartwaste.adminbackend.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// ++ Import PreAuthorize ++
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
// @CrossOrigin handled globally by SecurityConfig
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')") // ++ Require SUPER_ADMIN for all methods in this controller ++
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    // GET /api/v1/admin/users - Get all admin users
    @GetMapping
    public ResponseEntity<List<AdminUser>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllAdminUsers());
    }

    // GET /api/v1/admin/users/{id} - Get user by ID (password excluded by service)
    @GetMapping("/{id}")
    public ResponseEntity<AdminUser> getUserById(@PathVariable String id) {
        return adminUserService.getAdminUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/v1/admin/users - Create a new admin user
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody AdminUser newUserRequest) {
        try {
            // Password should be included in the request body for creation
            AdminUser createdUser = adminUserService.createAdminUser(newUserRequest);
            return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // PUT /api/v1/admin/users/{id}/role - Update only the user's role
    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newRole = payload.get("role");
        if (newRole == null || newRole.isEmpty()){
            return ResponseEntity.badRequest().body(Map.of("message", "Role is required."));
        }
        try {
            return adminUserService.updateAdminUserRole(id, newRole)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Optional: PUT /api/v1/admin/users/{id}/password - Update password (handle carefully)
    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateUserPassword(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("password");
        if (newPassword == null || newPassword.isEmpty()){
            return ResponseEntity.badRequest().body(Map.of("message", "New password is required."));
        }
        try {
            adminUserService.updateAdminPassword(id, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


    // DELETE /api/v1/admin/users/{id} - Delete a user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        if (adminUserService.deleteAdminUser(id)) {
            return ResponseEntity.noContent().build(); // 204 Success, no body
        } else {
            // Could be not found or deletion prevented (last super admin)
            // Return 404 for simplicity, or 403 Forbidden if deletion was prevented
            return ResponseEntity.notFound().build();
        }
    }
}