package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.PriceHistory;
import com.ace5.arcadium.entity.PriceHistoryId;

/**
 * Repository dello storico prezzi (chiave composta app_id+recorded_at).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T10+).
 */
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, PriceHistoryId> {
}
