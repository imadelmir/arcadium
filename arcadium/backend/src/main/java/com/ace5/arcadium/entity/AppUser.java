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
 *
 * <p>{@code steam_api_key} (V17) segue la stessa logica di {@code password_hash}
 * — un segreto che non deve mai uscire da qui — ma con una differenza: una
 * password si confronta soltanto, quindi basta l'hash, mentre una chiave API va
 * riusata a ogni chiamata verso Steam e quindi si conserva cifrata
 * (AES-256-GCM, {@code security/SecretCipher}). Nessun DTO la espone.
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

    private String previousUsername;          // TEXT, nullable (V16) — username precedente, mostrato sul profilo pubblico
    private LocalDateTime usernameChangedAt;  // TIMESTAMP, nullable (V16) — ultimo cambio username, per il cooldown (1 volta / 2 mesi)

    private Short abandonAfterMonths;         // SMALLINT, nullable (V9) — timeout auto-abbandono: NULL=off, 1/3/6 mesi

    // BOOLEAN NOT NULL DEFAULT TRUE (V18) — filtro contenuti per adulti nel Negozio.
    // Inizializzato a TRUE anche in Java: la colonna e' NOT NULL e Hibernate
    // include comunque il campo nell'INSERT, quindi un nuovo utente registrato
    // con il campo a null farebbe fallire la registrazione. Il default del DB
    // copre le righe gia' esistenti, questo copre quelle nuove.
    private Boolean safeSearch = Boolean.TRUE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;          // TIMESTAMP NOT NULL DEFAULT now()

    @UpdateTimestamp
    private LocalDateTime updatedAt;          // TIMESTAMP NOT NULL DEFAULT now()

    // --- Integrazione e i18n (V2, M2-T7) ---
    private String preferredLanguage;         // VARCHAR(2) NOT NULL DEFAULT 'it' ('it'/'en')

    @Column(unique = true)
    private String steamId;                   // TEXT, nullable e UNIQUE (connect Steam, M4-T16)

    private String steamApiKey;               // TEXT, nullable (V17) — chiave Steam Web API dell'utente, CIFRATA (SecretCipher); mai in chiaro ne' esposta dall'API

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

    public String getPreviousUsername() { return previousUsername; }
    public void setPreviousUsername(String previousUsername) { this.previousUsername = previousUsername; }

    public LocalDateTime getUsernameChangedAt() { return usernameChangedAt; }
    public void setUsernameChangedAt(LocalDateTime usernameChangedAt) { this.usernameChangedAt = usernameChangedAt; }

    public Short getAbandonAfterMonths() { return abandonAfterMonths; }
    public void setAbandonAfterMonths(Short abandonAfterMonths) { this.abandonAfterMonths = abandonAfterMonths; }

    /**
     * Safe search (V18): {@code TRUE} = i contenuti per adulti sono nascosti dal
     * Negozio. La colonna e' NOT NULL DEFAULT TRUE, ma il getter puo' restituire
     * null per un'istanza appena costruita e non ancora persistita: chi legge usa
     * {@code !Boolean.FALSE.equals(...)} per trattare l'assenza come "attivo".
     */
    public Boolean getSafeSearch() { return safeSearch; }
    public void setSafeSearch(Boolean safeSearch) { this.safeSearch = safeSearch; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getSteamId() { return steamId; }
    public void setSteamId(String steamId) { this.steamId = steamId; }

    public String getSteamApiKey() { return steamApiKey; }
    public void setSteamApiKey(String steamApiKey) { this.steamApiKey = steamApiKey; }

    public String getDiscordUrl() { return discordUrl; }
    public void setDiscordUrl(String discordUrl) { this.discordUrl = discordUrl; }

    public String getTwitchUrl() { return twitchUrl; }
    public void setTwitchUrl(String twitchUrl) { this.twitchUrl = twitchUrl; }
}
