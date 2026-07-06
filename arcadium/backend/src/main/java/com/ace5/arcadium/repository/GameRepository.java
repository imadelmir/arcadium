package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Game;

/**
 * Repository del catalogo giochi (chiave naturale app_id).
 * I metodi di query specifici (ricerca, filtri) arrivano coi rispettivi
 * endpoint (M4-T5+).
 */
public interface GameRepository extends JpaRepository<Game, Long> {
}
