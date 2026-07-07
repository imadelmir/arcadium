package com.ace5.arcadium.entity;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/**
 * Preferenze dell'utente per tipo di notifica (tabella
 * {@code notification_preference}, M2-T9). PK composta (user_id, type):
 * una preferenza per utente e tipo.
 *
 * <p>Solo {@code user_id} è FK (via @MapsId verso {@link AppUser}); {@code type}
 * è un tag testuale, componente dell'id ma non associazione. {@code enabled}
 * attiva/disattiva il tipo (default true). @ManyToOne LAZY.
 */
@Entity
@Table(name = "notification_preference")
public class NotificationPreference {

    @EmbeddedId
    private NotificationPreferenceId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    private Boolean enabled;                  // BOOLEAN NOT NULL DEFAULT TRUE

    public NotificationPreference() {
        // Costruttore richiesto da JPA.
    }

    public NotificationPreference(AppUser user, String type, Boolean enabled) {
        this.user = user;
        this.enabled = enabled;
        this.id = new NotificationPreferenceId(user.getId(), type);
    }

    public NotificationPreferenceId getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
