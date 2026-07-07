package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.NotificationPreference;
import com.ace5.arcadium.entity.NotificationPreferenceId;

/**
 * Repository delle preferenze di notifica (chiave composta user_id+type).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T10+).
 */
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, NotificationPreferenceId> {
}
