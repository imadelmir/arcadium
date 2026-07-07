package com.ace5.arcadium.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ace5.arcadium.entity.UserAchievement;
import com.ace5.arcadium.entity.UserAchievementId;

/**
 * Repository degli sblocchi (chiave composta user_id+achievement_id).
 * I metodi di query specifici arrivano coi rispettivi endpoint (M4-T10+).
 */
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievementId> {
}
