package com.smartwaste.adminbackend.security;

import com.smartwaste.adminbackend.model.AdminUser;
import com.smartwaste.adminbackend.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
// ++ Import Authority classes ++
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections; // ++ Import Collections ++
import java.util.List;

@Service
public class AdminUserDetailsService implements UserDetailsService {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AdminUser adminUser = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // ++ Create a GrantedAuthority list from the user's role string ++
        List<GrantedAuthority> authorities = Collections.emptyList();
        if (StringUtils.hasText(adminUser.getRole())) {
            authorities = Collections.singletonList(new SimpleGrantedAuthority(adminUser.getRole()));
        }

        // ++ Return Spring Security User with authorities ++
        return new User(adminUser.getUsername(), adminUser.getPassword(), authorities);
    }
}