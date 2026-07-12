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
 * Token di recupero password (tabella {@code password_reset_token}, M4-T17).
 *
 * <p>Sostiene il flusso "password dimenticata": alla richiesta di reset si crea
 * un token casuale, si invia all'utente un link che lo contiene e si salva qui
 * soltanto il suo <em>hash</em> (mai il token in chiaro, come per
 * {@code app_user.password_hash} in M4-T3). Con quel token l'utente imposta una
 * nuova password.
 *
 * <p>Il token e':
 * <ul>
 *   <li><b>a tempo</b> — {@link #expiresAt}: scaduto, non e' piu' valido;</li>
 *   <li><b>monouso</b> — {@link #usedAt}: valorizzato al primo utilizzo, cosi'
 *       lo stesso link non si riusa.</li>
 * </ul>
 *
 * <p>Mappata su schema gestito da Flyway (V5): Hibernate valida, non genera DDL
 * (ddl-auto=validate). Relazione {@code @ManyToOne} verso {@link AppUser}: piu'
 * token possono riferirsi allo stesso utente (richieste ripetute), LAZY perche'
 * l'utente serve solo quando si applica il reset.
 */
@Entity
@Table(name = "password_reset_token")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                          // BIGINT GENERATED ALWAYS AS IDENTITY

    // L'utente proprietario del token. LAZY: caricato solo quando serve (reset).
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;                     // FK -> app_user(id) ON DELETE CASCADE

    // Hash SHA-256 del token: si confronta con l'hash del token ricevuto nel link.
    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;                 // TEXT NOT NULL UNIQUE

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;          // TIMESTAMP NOT NULL (scadenza)

    @Column(name = "used_at")
    private LocalDateTime usedAt;             // TIMESTAMP, nullable (primo uso -> monouso)

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;          // TIMESTAMP NOT NULL DEFAULT now()

    public PasswordResetToken() {
        // Costruttore richiesto da JPA.
    }

    /**
     * Crea un token per un utente, col suo hash e la scadenza gia' calcolata dal
     * servizio (M4-T17). {@code createdAt} lo valorizza Hibernate al persist.
     *
     * @param user      utente che ha richiesto il reset
     * @param tokenHash hash SHA-256 del token in chiaro inviato nel link
     * @param expiresAt istante di scadenza del token
     */
    public PasswordResetToken(AppUser user, String tokenHash, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    /**
     * Il token e' spendibile? Vero solo se non e' gia' stato usato e non e'
     * scaduto rispetto all'istante passato. Concentra qui la regola cosi' il
     * servizio resta leggibile.
     *
     * @param now istante corrente
     * @return true se il token e' ancora valido
     */
    public boolean isUsable(LocalDateTime now) {
        return usedAt == null && expiresAt.isAfter(now);
    }

    /** Segna il token come consumato (token monouso). */
    public void markUsed(LocalDateTime when) {
        this.usedAt = when;
    }

    public Long getId() { return id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
