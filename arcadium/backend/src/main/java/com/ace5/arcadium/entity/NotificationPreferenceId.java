package com.ace5.arcadium.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Chiave composta di {@link NotificationPreference}: (user_id, type).
 *
 * A differenza delle altre chiavi composte, qui solo {@code userId} è una FK
 * (legata via @MapsId): {@code type} è un tag testuale semplice, parte della PK
 * ma non riferimento a un'altra entità. Come richiede JPA per un @EmbeddedId:
 * Serializable, no-arg ctor, equals/hashCode.
 */
@Embeddable
public class NotificationPreferenceId implements Serializable {

    @Column(name = "user_id")
    private Long userId;                      // -> app_user.id (BIGINT)

    @Column(name = "type")
    private String type;                      // 'achievement_unlocked' / 'price_drop' / 'system'

    public NotificationPreferenceId() {
    }

    public NotificationPreferenceId(Long userId, String type) {
        this.userId = userId;
        this.type = type;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof NotificationPreferenceId other)) return false;
        return Objects.equals(userId, other.userId) && Objects.equals(type, other.type);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, type);
    }
}
