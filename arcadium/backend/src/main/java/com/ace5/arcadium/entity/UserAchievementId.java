package com.ace5.arcadium.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Chiave composta di {@link UserAchievement}: (user_id, achievement_id).
 *
 * Le componenti sono i valori delle FK verso app_user e achievement; il legame
 * con le associazioni @ManyToOne è realizzato in UserAchievement tramite @MapsId.
 * Come richiede JPA per un @EmbeddedId: Serializable, no-arg ctor, equals/hashCode.
 */
@Embeddable
public class UserAchievementId implements Serializable {

    @Column(name = "user_id")
    private Long userId;                      // -> app_user.id (BIGINT)

    @Column(name = "achievement_id")
    private Long achievementId;               // -> achievement.id (BIGINT)

    public UserAchievementId() {
    }

    public UserAchievementId(Long userId, Long achievementId) {
        this.userId = userId;
        this.achievementId = achievementId;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getAchievementId() { return achievementId; }
    public void setAchievementId(Long achievementId) { this.achievementId = achievementId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserAchievementId other)) return false;
        return Objects.equals(userId, other.userId)
                && Objects.equals(achievementId, other.achievementId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, achievementId);
    }
}
