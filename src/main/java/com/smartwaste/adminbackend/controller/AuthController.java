package com.smartwaste.adminbackend.controller;

import com.smartwaste.adminbackend.model.AdminUser;
import com.smartwaste.adminbackend.repository.AdminUserRepository;
import com.smartwaste.adminbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // For response structure

// DTOs (Data Transfer Objects) for request bodies
record AuthRequest(String username, String password) {}
record RegisterRequest(String username, String password, String role) {}

@RestController
@RequestMapping("/api/v1/auth")
// NOTE: We don't need @CrossOrigin here because SecurityConfig handles it globally
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService; // Use the interface

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // POST /api/v1/auth/register (Simple registration, ensure first admin is created manually or via runner)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        if (adminUserRepository.findByUsername(registerRequest.username()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }
        AdminUser newUser = new AdminUser();
        newUser.setUsername(registerRequest.username());
        newUser.setPassword(passwordEncoder.encode(registerRequest.password()));
        newUser.setRole(registerRequest.role() != null ? registerRequest.role() : "ROLE_USER"); // Default role
        adminUserRepository.save(newUser);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }


    // POST /api/v1/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) throws Exception {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username(), authRequest.password())
            );
        } catch (BadCredentialsException e) {
            // throw new Exception("Incorrect username or password", e);
            return ResponseEntity.status(401).body(Map.of("message", "Incorrect username or password"));
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username());
        final String jwt = jwtUtil.generateToken(userDetails);

        // Return the token in the response body
        return ResponseEntity.ok(Map.of("token", jwt));
    }
}