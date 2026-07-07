package com.ace5.arcadium.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.AppUser;

/**
 * Repository degli utenti (registrazione, ricerca, profilo).
 *
 * <p>I metodi derivati sono usati dall'autenticazione (M4-T3):
 * {@code findByUsername} per il login e per ricaricare il principal dal token;
 * {@code existsByUsername}/{@code existsByEmail} per i controlli di unicità in
 * registrazione. Altri metodi di query arrivano coi rispettivi endpoint (M4-T9+).
 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
