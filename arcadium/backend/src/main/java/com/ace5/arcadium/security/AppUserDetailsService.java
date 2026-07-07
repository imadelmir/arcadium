package com.ace5.arcadium.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.ace5.arcadium.entity.AppUser;
import com.ace5.arcadium.repository.AppUserRepository;

/**
 * Carica un utente per username e lo adatta a {@link UserDetails} (M4-T3).
 *
 * <p>Usato dal {@link JwtAuthenticationFilter} per ricostruire il principal a
 * partire dal subject del token. Il login vero (verifica password) avviene in
 * AuthService: qui non si controllano credenziali, si carica soltanto.
 */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository userRepository;

    public AppUserDetailsService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utente non trovato: " + username));
        return new AppUserPrincipal(user);
    }
}
