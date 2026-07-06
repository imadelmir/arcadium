package com.ace5.arcadium.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Chiave composta di {@link Wishlist}: (user_id, app_id).
 *
 * Le componenti sono i valori delle FK verso app_user e games; il legame con le
 * associazioni @ManyToOne è realizzato in Wishlist tramite @MapsId. Come richiede
 * JPA per un @EmbeddedId: Serializable, no-arg ctor, equals/hashCode.
 */
@Embeddable
public class WishlistId implements Serializable {

    @Column(name = "user_id")
    private Long userId;                      // -> app_user.id (BIGINT)

    @Column(name = "app_id")
    private Long appId;                       // -> games.app_id (BIGINT)

    public WishlistId() {
    }

    public WishlistId(Long userId, Long appId) {
        this.userId = userId;
        this.appId = appId;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getAppId() { return appId; }
    public void setAppId(Long appId) { this.appId = appId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WishlistId other)) return false;
        return Objects.equals(userId, other.userId) && Objects.equals(appId, other.appId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, appId);
    }
}
