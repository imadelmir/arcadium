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
 * Giochi posseduti da un utente, con stato e tempo di gioco (tabella
 * {@code backlog}, M2-T4). Associazione POSSIEDE app_user &lt;-&gt; games.
 *
 * <p>PK composta (user_id, app_id) come {@link BacklogId}; utente e gioco legati
 * con @MapsId. {@code status_id} è una FK separata verso {@link BacklogStatus}
 * (NOT NULL; default 'mai_giocato' applicato dal servizio, M4-T8). Tempo di
 * gioco e date di avanzamento popolati a runtime e da sync Steam (M4-T16).
 * Tutti i @ManyToOne sono LAZY.
 */
@Entity
@Table(name = "backlog")
public class Backlog {

    @EmbeddedId
    private BacklogId id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @MapsId("appId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id")
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "status_id")
    private BacklogStatus status;             // FK -> backlog_status (ON DELETE RESTRICT)

    private Integer playtimeMinutes;          // INTEGER, nullable (>= 0; da sync Steam)

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime addedAt;            // TIMESTAMP NOT NULL DEFAULT now()

    private LocalDateTime startedAt;          // TIMESTAMP, nullable (passaggio a 'in corso')
    private LocalDateTime finishedAt;         // TIMESTAMP, nullable (passaggio a 'finito')
    private LocalDateTime lastPlayedAt;       // TIMESTAMP, nullable (ultima sessione)

    public Backlog() {
        // Costruttore richiesto da JPA.
    }

    public Backlog(AppUser user, Game game, BacklogStatus status) {
        this.user = user;
        this.game = game;
        this.status = status;
        this.id = new BacklogId(user.getId(), game.getAppId());
    }

    public BacklogId getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public Game getGame() { return game; }
    public void setGame(Game game) { this.game = game; }

    public BacklogStatus getStatus() { return status; }
    public void setStatus(BacklogStatus status) { this.status = status; }

    public Integer getPlaytimeMinutes() { return playtimeMinutes; }
    public void setPlaytimeMinutes(Integer playtimeMinutes) { this.playtimeMinutes = playtimeMinutes; }

    public LocalDateTime getAddedAt() { return addedAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(LocalDateTime finishedAt) { this.finishedAt = finishedAt; }

    public LocalDateTime getLastPlayedAt() { return lastPlayedAt; }
    public void setLastPlayedAt(LocalDateTime lastPlayedAt) { this.lastPlayedAt = lastPlayedAt; }
}
