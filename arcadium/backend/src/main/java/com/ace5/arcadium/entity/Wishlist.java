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
 * Giochi che un utente desidera acquistare (tabella {@code wishlist}, M2-T4).
 *
 * <p>Associazione DESIDERA app_user &lt;-&gt; games con attributo {@code added_at}.
 * PK composta (user_id, app_id): un gioco compare al più una volta per utente.
 *
 * <p>La chiave è un {@link WishlistId}; i due @ManyToOne (utente, gioco) sono
 * legati alle componenti della PK con @MapsId, così le colonne user_id/app_id
 * non sono duplicate. Fetch LAZY. CRUD esposto in M4-T7.
 */
@Entity
@Table(name = "wishlist")
public class Wishlist {

    @EmbeddedId
    private WishlistId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @MapsId("appId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id")
    private Game game;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime addedAt;            // TIMESTAMP NOT NULL DEFAULT now()

    public Wishlist() {
        // Costruttore richiesto da JPA.
    }

    public Wishlist(AppUser user, Game game) {
        this.user = user;
        this.game = game;
        this.id = new WishlistId(user.getId(), game.getAppId());
    }

    public WishlistId getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public Game getGame() { return game; }
    public void setGame(Game game) { this.game = game; }

    public LocalDateTime getAddedAt() { return addedAt; }
}
