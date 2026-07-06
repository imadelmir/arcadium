package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.BacklogStatus;

/**
 * Repository della lookup stati del backlog (seed).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T7+).
 */
public interface BacklogStatusRepository extends JpaRepository<BacklogStatus, Long> {
}
