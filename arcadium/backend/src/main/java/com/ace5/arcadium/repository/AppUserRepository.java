package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.AppUser;

/**
 * Repository degli utenti (registrazione, ricerca, profilo).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T7+).
 */
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
}
