package com.ace5.arcadium.entity;

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
 * Notifica destinata a un utente (tabella {@code notification}, M2-T9).
 *
 * <p>Future-ready (M1-T7 §2): la tabella esiste da subito, ma le notifiche di
 * calo prezzo restano dietro feature flag spento (M4-T13). {@code type} è un tag
 * testuale libero: achievement_unlocked / price_drop / system.
 *
 * <p>{@code related_app_id} è il gioco collegato (es. calo prezzo), opzionale:
 * @ManyToOne nullable, ON DELETE SET NULL a livello di schema (la notifica
 * sopravvive alla rimozione del gioco). Entrambi i @ManyToOne sono LAZY.
 */
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                          // BIGINT GENERATED ALWAYS AS IDENTITY

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;                     // destinatario (ON DELETE CASCADE)

    private String type;                      // TEXT NOT NULL (tag libero)
    private String message;                   // TEXT, nullable

    private Boolean isRead;                   // BOOLEAN NOT NULL DEFAULT FALSE

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;          // TIMESTAMP NOT NULL DEFAULT now()

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_app_id")
    private Game relatedGame;                 // gioco collegato, nullable (ON DELETE SET NULL)

    public Notification() {
        // Costruttore richiesto da JPA.
    }

    public Long getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public Game getRelatedGame() { return relatedGame; }
    public void setRelatedGame(Game relatedGame) { this.relatedGame = relatedGame; }
}
