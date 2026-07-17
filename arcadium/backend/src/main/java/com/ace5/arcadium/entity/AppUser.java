package com.ace5.arcadium.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Utente registrato della piattaforma (tabella {@code app_user}, M2-T3 + M2-T7).
 *
 * <p>Nome {@code app_user} e non {@code user} perché quest'ultimo è riservato in
 * PostgreSQL (M1-T5 §3). Le password non sono mai in chiaro: si conserva solo
 * {@code password_hash} (auth JWT, M4-T3).
 *
 * <p>Mutabile: popolata a runtime dalla registrazione (M4-T3). {@code created_at}
 * e {@code updated_at} sono valorizzati da Hibernate al persist/update
 * (@CreationTimestamp / @UpdateTimestamp), coerentemente col DEFAULT now() del DB.
 *
 * <p>I campi di integrazione ({@code steam_id}, {@code discord_url},
 * {@code twitch_url}) e {@code preferred_language} arrivano dalla migrazione V2
 * (M2-T7): sono già colonne di app_user, quindi mappati qui.
 */
@Entity
@Table(name = "app_user")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                          // BIGINT GENERATED ALWAYS AS IDENTITY

    @Column(unique = true)
    private String username;                  // TEXT NOT NULL UNIQUE

    @Column(unique = true)
    private String email;                     // TEXT NOT NULL UNIQUE

    private String passwordHash;              // TEXT NOT NULL (hash con salt, mai in chiaro)

    private String displayName;               // TEXT, nullable
    private String avatarUrl;                 // TEXT, nullable

    private Boolean isProfilePublic;          // BOOLEAN NOT NULL DEFAULT TRUE

    private LocalDateTime profileVisibilityChangedAt;  // TIMESTAMP, nullable — ultimo cambio di is_profile_public (cooldown 48h, V11)

    private Short abandonAfterMonths;         // SMALLINT, nullable (V9) — timeout auto-abbandono: NULL=off, 1/3/6 mesi

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;          // TIMESTAMP NOT NULL DEFAULT now()

    @UpdateTimestamp
    private LocalDateTime updatedAt;          // TIMESTAMP NOT NULL DEFAULT now()

    // --- Integrazione e i18n (V2, M2-T7) ---
    private String preferredLanguage;         // VARCHAR(2) NOT NULL DEFAULT 'it' ('it'/'en')

    @Column(unique = true)
    private String steamId;                   // TEXT, nullable e UNIQUE (connect Steam, M4-T16)

    private String discordUrl;                // TEXT, nullable (link social, M4-T15)
    private String twitchUrl;                 // TEXT, nullable (link social, M4-T15)

    public AppUser() {
        // Costruttore richiesto da JPA e usato dal servizio di registrazione (M4-T3).
    }

    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Boolean getIsProfilePublic() { return isProfilePublic; }
    public void setIsProfilePublic(Boolean isProfilePublic) { this.isProfilePublic = isProfilePublic; }

    public LocalDateTime getProfileVisibilityChangedAt() { return profileVisibilityChangedAt; }
    public void setProfileVisibilityChangedAt(LocalDateTime profileVisibilityChangedAt) { this.profileVisibilityChangedAt = profileVisibilityChangedAt; }

    public Short getAbandonAfterMonths() { return abandonAfterMonths; }
    public void setAbandonAfterMonths(Short abandonAfterMonths) { this.abandonAfterMonths = abandonAfterMonths; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getSteamId() { return steamId; }
    public void setSteamId(String steamId) { this.steamId = steamId; }

    public String getDiscordUrl() { return discordUrl; }
    public void setDiscordUrl(String discordUrl) { this.discordUrl = discordUrl; }

    public String getTwitchUrl() { return twitchUrl; }
    public void setTwitchUrl(String twitchUrl) { this.twitchUrl = twitchUrl; }
}
