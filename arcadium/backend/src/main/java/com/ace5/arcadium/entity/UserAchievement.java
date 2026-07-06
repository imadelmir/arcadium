package com.ace5.arcadium.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/**
 * Sblocchi degli achievement da parte degli utenti (tabella
 * {@code user_achievement}, M2-T8). Associazione SBLOCCA app_user &lt;-&gt;
 * achievement con attributo {@code unlocked_at}.
 *
 * <p>PK composta (user_id, achievement_id) come {@link UserAchievementId}: un
 * solo sblocco per utente e badge. I due @ManyToOne sono legati alle componenti
 * della PK con @MapsId, LAZY. Mutabile: popolato a runtime dal motore di
 * sblocco (M4-T11).
 */
@Entity
@Table(name = "user_achievement")
public class UserAchievement {

    @EmbeddedId
    private UserAchievementId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @MapsId("achievementId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "achievement_id")
    private Achievement achievement;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime unlockedAt;         // TIMESTAMP NOT NULL DEFAULT now()

    public UserAchievement() {
        // Costruttore richiesto da JPA.
    }

    public UserAchievement(AppUser user, Achievement achievement) {
        this.user = user;
        this.achievement = achievement;
        this.id = new UserAchievementId(user.getId(), achievement.getId());
    }

    public UserAchievementId getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public Achievement getAchievement() { return achievement; }
    public void setAchievement(Achievement achievement) { this.achievement = achievement; }

    public LocalDateTime getUnlockedAt() { return unlockedAt; }
}
