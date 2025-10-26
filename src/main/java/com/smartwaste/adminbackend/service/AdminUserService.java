package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.AdminUser;
import com.smartwaste.adminbackend.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils; // For checking empty strings

import java.util.List;
import java.util.Optional;

@Service
public class AdminUserService {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // To hash passwords

    public List<AdminUser> getAllAdminUsers() {
        List<AdminUser> users = adminUserRepository.findAll();
        // Don't send passwords back to the frontend
        users.forEach(user -> user.setPassword(null));
        return users;
    }

    public Optional<AdminUser> getAdminUserById(String id) {
        Optional<AdminUser> userOpt = adminUserRepository.findById(id);
        userOpt.ifPresent(user -> user.setPassword(null)); // Remove password
        return userOpt;
    }

    public Optional<AdminUser> getAdminUserByUsername(String username) {
        Optional<AdminUser> userOpt = adminUserRepository.findByUsername(username);
        // Keep password here for authentication service, but don't expose via API controller directly
        return userOpt;
    }


    public AdminUser createAdminUser(AdminUser adminUser) throws Exception {
        // Basic validation
        if (!StringUtils.hasText(adminUser.getUsername()) || !StringUtils.hasText(adminUser.getPassword())) {
            throw new Exception("Username and password are required.");
        }
        if (adminUserRepository.findByUsername(adminUser.getUsername()).isPresent()) {
            throw new Exception("Username already exists.");
        }
        // Validate Role (optional but good practice)
        if (!isValidRole(adminUser.getRole())) {
            adminUser.setRole(AdminUser.ROLE_OPERATOR); // Default to least privileged if invalid/missing
        }

        // Hash the password before saving
        adminUser.setPassword(passwordEncoder.encode(adminUser.getPassword()));
        AdminUser savedUser = adminUserRepository.save(adminUser);
        savedUser.setPassword(null); // Clear password before returning
        return savedUser;
    }

    public Optional<AdminUser> updateAdminUserRole(String id, String newRole) throws Exception {
        // Validate Role
        if (!isValidRole(newRole)) {
            throw new Exception("Invalid role specified.");
        }

        Optional<AdminUser> optionalUser = adminUserRepository.findById(id);
        if (optionalUser.isPresent()) {
            AdminUser user = optionalUser.get();
            // Optional: Prevent changing the role of the last super admin? Add more complex logic if needed.
            user.setRole(newRole);
            AdminUser updatedUser = adminUserRepository.save(user);
            updatedUser.setPassword(null); // Clear password
            return Optional.of(updatedUser);
        }
        return Optional.empty();
    }

    // Optional: Method to update password (handle separately for security)
    public Optional<AdminUser> updateAdminPassword(String id, String newPassword) throws Exception {
        if (!StringUtils.hasText(newPassword) || newPassword.length() < 6) { // Basic length check
            throw new Exception("New password is too short.");
        }
        Optional<AdminUser> optionalUser = adminUserRepository.findById(id);
        if (optionalUser.isPresent()) {
            AdminUser user = optionalUser.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            adminUserRepository.save(user);
            return Optional.of(user); // Password update successful (don't clear hash here)
        }
        return Optional.empty();
    }


    public boolean deleteAdminUser(String id) {
        // Optional: Add logic to prevent deleting the last SUPER_ADMIN
        Optional<AdminUser> userToDelete = adminUserRepository.findById(id);
        if (userToDelete.isPresent() && AdminUser.ROLE_SUPER_ADMIN.equals(userToDelete.get().getRole())) {
            long superAdminCount = adminUserRepository.findAll().stream()
                    .filter(u -> AdminUser.ROLE_SUPER_ADMIN.equals(u.getRole()))
                    .count();
            if (superAdminCount <= 1) {
                System.err.println("Cannot delete the last Super Admin user.");
                return false; // Prevent deletion
            }
        }

        if (adminUserRepository.existsById(id)) {
            adminUserRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Helper to validate roles
    private boolean isValidRole(String role) {
        return AdminUser.ROLE_SUPER_ADMIN.equals(role) ||
                AdminUser.ROLE_ADMIN.equals(role) ||
                AdminUser.ROLE_OPERATOR.equals(role);
    }
}