package com.ace5.arcadium.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Sessione di gioco dichiarata manualmente dall'utente (tabella
 * {@code playtime_entry}, M6 feature "registro ore"): quanti minuti, in che
 * giorno, su quale gioco del proprio backlog.
 *
 * <p>Alimenta il grafico "ore per mese" (aggregazione per {@code playedOn}) e il
 * totale manuale. La FK composta a livello DB e' verso {@code backlog(user_id,
 * app_id)}: qui, lato JPA, si mappano le due colonne come @ManyToOne LAZY verso
 * {@link AppUser} e {@link Game}, coerentemente con {@link Backlog}. Lo schema e'
 * gestito da Flyway (V15), non da Hibernate: nessun vincolo generato a runtime.
 */
@Entity
@Table(name = "playtime_entry")
public class PlaytimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "app_id")
    private Game game;

    @Column(nullable = false)
    private Integer minutes;              // > 0 (vincolo DB chk_playtime_entry_minutes)

    @Column(name = "played_on", nullable = false)
    private LocalDate playedOn;           // giorno della sessione: determina il mese

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public PlaytimeEntry() {
        // Costruttore richiesto da JPA.
    }

    public PlaytimeEntry(AppUser user, Game game, Integer minutes, LocalDate playedOn) {
        this.user = user;
        this.game = game;
        this.minutes = minutes;
        this.playedOn = playedOn;
    }

    public Long getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public Game getGame() { return game; }
    public void setGame(Game game) { this.game = game; }

    public Integer getMinutes() { return minutes; }
    public void setMinutes(Integer minutes) { this.minutes = minutes; }

    public LocalDate getPlayedOn() { return playedOn; }
    public void setPlayedOn(LocalDate playedOn) { this.playedOn = playedOn; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
