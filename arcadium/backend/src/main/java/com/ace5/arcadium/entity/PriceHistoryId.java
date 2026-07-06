package com.ace5.arcadium.entity;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Chiave composta di {@link PriceHistory}: (app_id, recorded_at).
 *
 * {@code appId} è la FK verso games (legata via @MapsId); {@code recordedAt} è
 * l'istante della rilevazione, componente della PK. Essendo parte della chiave,
 * va valorizzato dall'applicazione (il job M4-T13) prima del persist: non si può
 * delegare al DEFAULT now() del DB. Come richiede JPA per un @EmbeddedId:
 * Serializable, no-arg ctor, equals/hashCode.
 */
@Embeddable
public class PriceHistoryId implements Serializable {

    @Column(name = "app_id")
    private Long appId;                       // -> games.app_id (BIGINT)

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;         // istante della rilevazione (parte della PK)

    public PriceHistoryId() {
    }

    public PriceHistoryId(Long appId, LocalDateTime recordedAt) {
        this.appId = appId;
        this.recordedAt = recordedAt;
    }

    public Long getAppId() { return appId; }
    public void setAppId(Long appId) { this.appId = appId; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PriceHistoryId other)) return false;
        return Objects.equals(appId, other.appId) && Objects.equals(recordedAt, other.recordedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(appId, recordedAt);
    }
}
