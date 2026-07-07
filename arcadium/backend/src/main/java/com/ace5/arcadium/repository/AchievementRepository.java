package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Achievement;

/**
 * Repository del catalogo achievement (seed).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T10+).
 */
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
}
