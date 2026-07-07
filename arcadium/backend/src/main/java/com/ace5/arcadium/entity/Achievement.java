package com.ace5.arcadium.entity;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Catalogo degli achievement interni di Arcadium (tabella {@code achievement},
 * M2-T8). Gamification data-driven: ogni badge porta una {@code metric} e una
 * {@code threshold} che il motore di sblocco (M4-T11) confronta con le metriche
 * derivate da backlog/wishlist dell'utente (M1-T7).
 *
 * <p>Distinto da {@code games.achievements_count} (achievement Steam del dataset).
 * Le definizioni sono caricate da seed (R__achievements.sql); il backend non le
 * scrive → {@link Immutable}. (Se in futuro servisse un toggle di {@code is_active}
 * da backend, rimuovere @Immutable.)
 */
@Entity
@Table(name = "achievement")
@Immutable
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                          // BIGINT GENERATED ALWAYS AS IDENTITY

    @Column(unique = true)
    private String code;                      // TEXT NOT NULL UNIQUE ('finisher_10'...)

    private String nameIt;                    // TEXT NOT NULL (i18n)
    private String nameEn;                    // TEXT NOT NULL (i18n)
    private String descriptionIt;             // TEXT, nullable (i18n)
    private String descriptionEn;             // TEXT, nullable (i18n)
    private String iconUrl;                    // TEXT, nullable

    private String metric;                    // TEXT NOT NULL (games_owned, playtime_hours, ...)
    private Integer threshold;                // INTEGER NOT NULL (>= 1)
    private Short points;                     // SMALLINT NOT NULL DEFAULT 0 -> Short
    private Boolean isActive;                 // BOOLEAN NOT NULL DEFAULT TRUE (soft-delete)

    protected Achievement() {
        // Costruttore richiesto da JPA.
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getNameIt() { return nameIt; }
    public String getNameEn() { return nameEn; }
    public String getDescriptionIt() { return descriptionIt; }
    public String getDescriptionEn() { return descriptionEn; }
    public String getIconUrl() { return iconUrl; }
    public String getMetric() { return metric; }
    public Integer getThreshold() { return threshold; }
    public Short getPoints() { return points; }
    public Boolean getIsActive() { return isActive; }
}
