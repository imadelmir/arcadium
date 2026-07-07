package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.Notification;

/**
 * Repository delle notifiche utente.
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T10+).
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
