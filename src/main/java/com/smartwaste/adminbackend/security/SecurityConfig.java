package com.smartwaste.adminbackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Import HttpMethod if using http method restrictions
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity; // Enable @PreAuthorize
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
// import org.springframework.web.filter.CorsFilter; // Not strictly needed if using http.cors()

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // Enable controller/service level security annotations
public class SecurityConfig {

    // Inject UserDetailsService and JWT Filter
    @Autowired private AdminUserDetailsService adminUserDetailsService; // Correct UserDetailsService implementation
    @Autowired private JwtRequestFilter jwtRequestFilter;

    // Bean for hashing passwords
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Bean to expose the AuthenticationManager
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Main security configuration chain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Configure CORS using the corsConfigurationSource bean below
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF protection as we are using stateless JWT authentication
                .csrf(csrf -> csrf.disable())
                // Configure authorization rules for HTTP requests
                .authorizeHttpRequests(auth -> auth
                        // Allow unauthenticated access to login and registration endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // ** IMPORTANT **: Since we are using @PreAuthorize on controllers,
                        // we only need a general rule here to require authentication for API endpoints.
                        // Specific role checks are handled by annotations (e.g., @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')"))
                        // on the controller methods or classes themselves.
                        .requestMatchers("/api/v1/**").authenticated() // Require authentication for all other /api/v1/** paths

                        // Allow access to any other requests (e.g., serving frontend static files if done by backend)
                        // Adjust this if your frontend is served separately or needs specific paths allowed
                        .anyRequest().permitAll()
                )
                // Configure session management to be stateless (no server-side session)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        // Add the custom JWT filter before the standard Spring Security username/password filter
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        // Build the security filter chain
        return http.build();
    }

    // Bean to configure Cross-Origin Resource Sharing (CORS) globally for the API
    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true); // Allow sending credentials (like cookies or auth headers)
        config.addAllowedOrigin("http://localhost:5173"); // Allow requests ONLY from your frontend URL
        config.addAllowedHeader("*"); // Allow all standard headers (Authorization, Content-Type, etc.)
        config.addAllowedMethod("*"); // Allow all standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS, etc.)
        // Apply this CORS configuration to all paths under /api/
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}