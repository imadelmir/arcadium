package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Backlog;
import com.ace5.arcadium.entity.BacklogId;

/**
 * Repository del backlog (chiave composta user_id+app_id).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T7+).
 */
public interface BacklogRepository extends JpaRepository<Backlog, BacklogId> {
}
