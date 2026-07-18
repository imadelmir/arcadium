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
 * Amicizia tra due utenti (tabella {@code friendship}, V10).
 *
 * <p>La stessa riga rappresenta sia la RICHIESTA sia l'AMICIZIA:
 * <ul>
 *   <li>{@code status = 'pending'} — richiesta inviata da {@code requester} e in
 *       attesa che {@code addressee} accetti; la direzione conta solo qui;</li>
 *   <li>{@code status = 'accepted'} — sono amici (relazione simmetrica: la
 *       direzione non conta piu').</li>
 * </ul>
 *
 * <p>Rifiuto, annullamento della richiesta e rimozione di un amico sono tutti
 * una DELETE della riga (nessuno storico, come da nota della migrazione V10).
 * L'indice unico {@code uq_friendship_pair} garantisce UNA sola relazione per
 * coppia in qualsiasi direzione.
 *
 * <p>Tutti i @ManyToOne sono LAZY, come nel resto del dominio.
 */
@Entity
@Table(name = "friendship")
public class Friendship {

    /** Stato: richiesta in attesa di risposta. */
    public static final String STATUS_PENDING = "pending";

    /** Stato: richiesta accettata, i due utenti sono amici. */
    public static final String STATUS_ACCEPTED = "accepted";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                       // BIGINT GENERATED ALWAYS AS IDENTITY

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id")
    private AppUser requester;             // chi ha inviato la richiesta

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "addressee_id")
    private AppUser addressee;             // chi deve accettarla

    @Column(nullable = false)
    private String status;                 // 'pending' | 'accepted'

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;       // invio della richiesta

    private LocalDateTime respondedAt;     // accettazione (NULL finche' pending)

    protected Friendship() {
        // richiesto da JPA
    }

    /** Nuova richiesta di amicizia, in stato "pending". */
    public Friendship(AppUser requester, AppUser addressee) {
        this.requester = requester;
        this.addressee = addressee;
        this.status = STATUS_PENDING;
    }

    public Long getId() { return id; }

    public AppUser getRequester() { return requester; }

    public AppUser getAddressee() { return addressee; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }

    /** true se la relazione e' un'amicizia confermata. */
    public boolean isAccepted() {
        return STATUS_ACCEPTED.equals(status);
    }

    /**
     * L'altro utente della relazione rispetto a {@code userId}: serve alle liste
     * ("i miei amici", "richieste ricevute"), dove interessa sempre la controparte.
     */
    public AppUser other(Long userId) {
        return requester.getId().equals(userId) ? addressee : requester;
    }
}
