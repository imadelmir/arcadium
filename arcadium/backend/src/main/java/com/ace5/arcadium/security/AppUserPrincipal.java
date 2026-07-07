package com.ace5.arcadium.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.ace5.arcadium.entity.AppUser;

/**
 * Adattatore fra {@link AppUser} e il contratto {@link UserDetails} di Spring
 * Security (M4-T3).
 *
 * <p>Avvolge l'utente caricato dal DB ed espone ciò che serve alla security:
 * username, hash della password e un unico ruolo {@code ROLE_USER} (il modello
 * non prevede una tabella ruoli). Conserva il riferimento ad {@link AppUser} in
 * modo che i controller possano recuperare l'utente autenticato via
 * {@code @AuthenticationPrincipal} senza una nuova query. AppUser non ha
 * associazioni LAZY, quindi l'accesso ai suoi campi fuori sessione è sicuro.
 */
public class AppUserPrincipal implements UserDetails {

    private static final Collection<GrantedAuthority> AUTHORITIES =
            List.of(new SimpleGrantedAuthority("ROLE_USER"));

    private final AppUser user;

    public AppUserPrincipal(AppUser user) {
        this.user = user;
    }

    public AppUser getAppUser() {
        return user;
    }

    public Long getId() {
        return user.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return AUTHORITIES;
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
